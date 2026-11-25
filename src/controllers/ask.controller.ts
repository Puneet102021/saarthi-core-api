import { Request, Response } from "express";

import { buildNatalChart } from "../astrology/chart";
import { ChatMessage, llmAvailable } from "../lib/llm";
import { AuthRequest } from "../middleware/auth.middleware";
import { askQuestion, AskResult } from "../reading/ask";
import { streamQuestion } from "../reading/stream";
import { normaliseProfile } from "../reading/profile";
import { getUserChart } from "../services/chartService";
import { loadMemory, scheduleMemoryUpdate, shortTermHistory } from "../memory/store";
import { appendTurn, getOrCreateThread } from "../services/conversationService";
import { BadRequestError, parseBirthInput, sendError } from "./chart.controller";

const MAX_MESSAGE = 2000;

interface ParsedAsk {
  message: string;
  history: ChatMessage[];
}

/* `message` is the chat field; `question` is still accepted from older clients. */
export function parseAsk(body: any): ParsedAsk {
  const raw = typeof body?.message === "string" ? body.message : body?.question;
  const message = typeof raw === "string" ? raw.trim() : "";

  if (!message) throw new BadRequestError("message is required");
  if (message.length > MAX_MESSAGE) throw new BadRequestError(`message must be at most ${MAX_MESSAGE} characters`);

  const rawHistory = Array.isArray(body?.history) ? body.history : [];

  /* Only user and assistant turns: a client must not be able to inject system instructions. */
  const history: ChatMessage[] = rawHistory
    .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
    .slice(-8)
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  return { message, history };
}

function publicResult(result: Awaited<ReturnType<typeof askQuestion>>, debug: boolean) {
  const { evidence, prompt, remediesOffered, ...rest } = result;

  return {
    ...rest,
    /* Cited evidence is always returned so the client can show "why"; the full brief only when debugging. */
    evidence: debug ? evidence : evidence.filter((e) => result.evidenceUsed.includes(e.id)),
    ...(debug ? { remediesOffered } : {}),
    ...(debug && prompt ? { prompt } : {})
  };
}

/* What an answer needs from the database: the chart, profile, memory and recent messages. */
async function conversationContext(userId: string) {
  const { chart, profile } = await getUserChart(userId);
  const thread = await getOrCreateThread(userId);

  /* Long-term notes and the running summary, then the recent messages word for word. */
  const memory = await loadMemory(userId);
  const { history, lastMessageAt, turnsSinceAstrology } = await shortTermHistory(userId, memory.runningThrough);

  return { chart, profile, thread, memory, history, lastMessageAt, turnsSinceAstrology };
}

/* Saves the turn and folds older messages into memory in the background. */
async function saveTurn(userId: string, threadId: string, message: string, result: AskResult) {
  const data = publicResult(result, false);
  try {
    const meta = {
      need: result.need,
      firstReading: result.firstReading,
      astrologyLevel: result.astrologyLevel,
      intent: result.intent,
      evidenceUsed: result.evidenceUsed,
      evidence: data.evidence,
      remedies: result.remedies,
      followUps: result.followUps,
      currentPeriod: result.currentPeriod,
      model: result.model
    };
    /* Plain JSON for the Json column (drops undefined values). */
    await appendTurn(threadId, message, result.answer ?? "", JSON.parse(JSON.stringify(meta)));
    scheduleMemoryUpdate(userId);
  } catch (saveError) {
    /* The person still gets their answer; the chat just misses this turn. */
    console.error("CHAT_SAVE_ERROR", saveError);
  }
  return data;
}

/* Each person has one continuous chat; the server keeps it, so the client sends only the new message. */
export async function ask(req: AuthRequest, res: Response) {
  try {
    const { message } = parseAsk(req.body);

    if (!llmAvailable()) {
      return res.status(503).json({ success: false, error: "The answer model is not configured" });
    }

    const userId = req.user!.userId;
    const ctx = await conversationContext(userId);

    const result = await askQuestion({
      chart: ctx.chart,
      question: message,
      history: ctx.history,
      profile: ctx.profile,
      lastMessageAt: ctx.lastMessageAt,
      memory: ctx.memory,
      turnsSinceAstrology: ctx.turnsSinceAstrology
    });

    const data = await saveTurn(userId, ctx.thread.id, message, result);
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "ASK_ERROR");
  }
}

/*
  POST /api/ask/stream: the same answer, sent as server-sent events so it
  appears as it is written. Events: "start" (need, astrology level),
  "delta" ({ text }), then "done" (the full result, as /api/ask returns it)
  or "error" ({ error }).
*/
export async function askStream(req: AuthRequest, res: Response) {
  let streaming = false;

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { message } = parseAsk(req.body);

    if (!llmAvailable()) {
      return res.status(503).json({ success: false, error: "The answer model is not configured" });
    }

    const userId = req.user!.userId;
    const ctx = await conversationContext(userId);

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    /* nginx must pass events through as they come, not buffer the whole reply. */
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    streaming = true;

    const result = await streamQuestion(
      {
        chart: ctx.chart,
        question: message,
        history: ctx.history,
        profile: ctx.profile,
        lastMessageAt: ctx.lastMessageAt,
        memory: ctx.memory,
        turnsSinceAstrology: ctx.turnsSinceAstrology
      },
      {
        onStart: (info) => send("start", info),
        onDelta: (text) => send("delta", { text })
      }
    );

    const data = await saveTurn(userId, ctx.thread.id, message, result);
    send("done", data);
    res.end();
  } catch (error) {
    if (!streaming) return sendError(res, error, "ASK_STREAM_ERROR");

    console.error("ASK_STREAM_ERROR", error);
    send("error", { error: "Saarthi couldn't finish that reply. Try again." });
    res.end();
  }
}

/* Developer route: ask with birth details in the body; dryRun returns the prompt without calling the model. */
export async function previewAsk(req: Request, res: Response) {
  try {
    const { message, history } = parseAsk(req.body);
    const chart = buildNatalChart(parseBirthInput(req.body));

    const dryRun = req.body?.dryRun === true || !llmAvailable();
    const now = req.body?.now ? new Date(req.body.now) : undefined;

    if (now && Number.isNaN(now.getTime())) throw new BadRequestError("now must be an ISO date");

    const profile = normaliseProfile({ name: req.body?.name, ...(req.body?.profile ?? {}) });

    const lastMessageAt = req.body?.lastMessageAt ? new Date(req.body.lastMessageAt) : null;
    if (lastMessageAt && Number.isNaN(lastMessageAt.getTime())) throw new BadRequestError("lastMessageAt must be an ISO date");

    /* Optional memory for previews: { running, facts: [{ category, text, eventDate, importance }] }. */
    const memory = req.body?.memory
      ? {
          running: typeof req.body.memory.running === "string" ? req.body.memory.running : null,
          facts: Array.isArray(req.body.memory.facts)
            ? req.body.memory.facts.map((f: any, i: number) => ({ id: `p${i}`, ...f }))
            : []
        }
      : undefined;

    const result = await askQuestion({ chart, question: message, history, dryRun, now, profile, lastMessageAt, memory });

    return res.json({ success: true, data: publicResult(result, true) });
  } catch (error) {
    return sendError(res, error, "ASK_PREVIEW_ERROR");
  }
}
