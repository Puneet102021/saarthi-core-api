import { Request, Response } from "express";

import { buildNatalChart } from "../astrology/chart";
import { ChatMessage, llmAvailable } from "../lib/llm";
import { AuthRequest } from "../middleware/auth.middleware";
import { askQuestion } from "../reading/ask";
import { normaliseProfile } from "../reading/profile";
import { getUserChart } from "../services/chartService";
import { appendTurn, getOrCreateConversation, recentHistory } from "../services/conversationService";
import { BadRequestError, parseBirthInput, sendError } from "./chart.controller";

const MAX_MESSAGE = 2000;

interface ParsedAsk {
  message: string;
  history: ChatMessage[];
  conversationId?: string;
}

/* `message` is the chat field; `question` is still accepted from older clients. */
export function parseAsk(body: any): ParsedAsk {
  const raw = typeof body?.message === "string" ? body.message : body?.question;
  const message = typeof raw === "string" ? raw.trim() : "";

  if (!message) throw new BadRequestError("message is required");
  if (message.length > MAX_MESSAGE) throw new BadRequestError(`message must be at most ${MAX_MESSAGE} characters`);

  const conversationId =
    typeof body?.conversationId === "string" && body.conversationId.trim() ? body.conversationId.trim() : undefined;

  const rawHistory = Array.isArray(body?.history) ? body.history : [];

  /* Only user and assistant turns: a client must not be able to inject system instructions. */
  const history: ChatMessage[] = rawHistory
    .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
    .slice(-8)
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  return { message, history, conversationId };
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

export async function ask(req: AuthRequest, res: Response) {
  try {
    const { message, history: clientHistory, conversationId } = parseAsk(req.body);

    if (!llmAvailable()) {
      return res.status(503).json({ success: false, error: "The answer model is not configured" });
    }

    const userId = req.user!.userId;
    const { chart, profile } = await getUserChart(userId);
    const conversation = await getOrCreateConversation(userId, conversationId, message);

    /* A saved conversation is the source of truth; client history only seeds a new one. */
    const history = conversationId ? await recentHistory(conversation.id) : clientHistory;

    const result = await askQuestion({ chart, question: message, history, profile });
    const data = publicResult(result, false);

    try {
      const meta = {
        need: result.need,
        intent: result.intent,
        evidenceUsed: result.evidenceUsed,
        evidence: data.evidence,
        remedies: result.remedies,
        followUps: result.followUps,
        currentPeriod: result.currentPeriod,
        model: result.model
      };
      /* Plain JSON for the Json column (drops undefined values). */
      await appendTurn(conversation.id, message, result.answer ?? "", JSON.parse(JSON.stringify(meta)));
    } catch (saveError) {
      /* The person still gets their answer; the thread just misses this turn. */
      console.error("CONVERSATION_SAVE_ERROR", saveError);
    }

    return res.json({ success: true, data: { conversationId: conversation.id, ...data } });
  } catch (error) {
    return sendError(res, error, "ASK_ERROR");
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

    const result = await askQuestion({ chart, question: message, history, dryRun, now, profile });

    return res.json({ success: true, data: publicResult(result, true) });
  } catch (error) {
    return sendError(res, error, "ASK_PREVIEW_ERROR");
  }
}
