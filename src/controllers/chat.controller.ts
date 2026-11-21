import { Response } from "express";

import { AuthRequest } from "../middleware/auth.middleware";
import { clearRunningMemory } from "../memory/store";
import { clearHistory, listMessages } from "../services/conversationService";
import { BadRequestError, sendError } from "./chart.controller";

/* GET /api/chat?before=<ISO date>&limit=30: one page of the person's continuous chat. */
export async function history(req: AuthRequest, res: Response) {
  try {
    const before = typeof req.query.before === "string" && req.query.before ? new Date(req.query.before) : undefined;
    if (before && Number.isNaN(before.getTime())) throw new BadRequestError("before must be an ISO date");

    const requested = Number(req.query.limit);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.floor(requested), 1), 100) : 30;

    const page = await listMessages(req.user!.userId, before, limit);
    return res.json({ success: true, data: page });
  } catch (error) {
    return sendError(res, error, "CHAT_HISTORY_ERROR");
  }
}

/* DELETE /api/chat: forget the whole chat. */
export async function clear(req: AuthRequest, res: Response) {
  try {
    await clearHistory(req.user!.userId);
    /* The running summary describes the chat, so it goes with it; long-term notes stay until forgotten. */
    await clearRunningMemory(req.user!.userId);
    return res.json({ success: true });
  } catch (error) {
    return sendError(res, error, "CHAT_CLEAR_ERROR");
  }
}
