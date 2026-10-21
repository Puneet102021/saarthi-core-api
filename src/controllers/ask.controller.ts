import { Request, Response } from "express";

import { buildNatalChart } from "../astrology/chart";
import { ChatMessage, llmAvailable } from "../lib/llm";
import { AuthRequest } from "../middleware/auth.middleware";
import { askQuestion } from "../reading/ask";
import { getUserChart } from "../services/chartService";
import { BadRequestError, parseBirthInput, sendError } from "./chart.controller";

function parseQuestion(body: any): { question: string; history: ChatMessage[] } {
  const question = typeof body?.question === "string" ? body.question.trim() : "";

  if (!question) throw new BadRequestError("question is required");
  if (question.length > 1000) throw new BadRequestError("question must be at most 1000 characters");

  const raw = Array.isArray(body?.history) ? body.history : [];

  /* Only user and assistant turns: a client must not be able to inject system instructions. */
  const history: ChatMessage[] = raw
    .filter(
      (m: any) =>
        (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string"
    )
    .slice(-8)
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  return { question, history };
}

function publicResult(result: Awaited<ReturnType<typeof askQuestion>>, debug: boolean) {
  const { evidence, prompt, ...rest } = result;

  return {
    ...rest,
    /* Cited evidence is always returned so the client can show "why"; the full brief only when debugging. */
    evidence: debug ? evidence : evidence.filter((e) => result.evidenceUsed.includes(e.id)),
    ...(debug && prompt ? { prompt } : {})
  };
}

export async function ask(req: AuthRequest, res: Response) {
  try {
    const { question, history } = parseQuestion(req.body);

    if (!llmAvailable()) {
      return res.status(503).json({ success: false, error: "The answer model is not configured" });
    }

    const { chart, name } = await getUserChart(req.user!.userId);
    const result = await askQuestion({ chart, question, history, name });

    return res.json({ success: true, data: publicResult(result, false) });
  } catch (error) {
    return sendError(res, error, "ASK_ERROR");
  }
}

/* Developer route: ask with birth details in the body; dryRun returns the prompt without calling the model. */
export async function previewAsk(req: Request, res: Response) {
  try {
    const { question, history } = parseQuestion(req.body);
    const chart = buildNatalChart(parseBirthInput(req.body));

    const dryRun = req.body?.dryRun === true || !llmAvailable();
    const now = req.body?.now ? new Date(req.body.now) : undefined;

    if (now && Number.isNaN(now.getTime())) throw new BadRequestError("now must be an ISO date");

    const result = await askQuestion({ chart, question, history, dryRun, now, name: req.body?.name });

    return res.json({ success: true, data: publicResult(result, true) });
  } catch (error) {
    return sendError(res, error, "ASK_PREVIEW_ERROR");
  }
}
