import { Response } from "express";

import { AuthRequest } from "../middleware/auth.middleware";
import { deleteConversation, getConversation, listConversations } from "../services/conversationService";
import { sendError } from "./chart.controller";

export async function list(req: AuthRequest, res: Response) {
  try {
    const conversations = await listConversations(req.user!.userId);
    return res.json({ success: true, data: conversations });
  } catch (error) {
    return sendError(res, error, "CONVERSATION_LIST_ERROR");
  }
}

export async function get(req: AuthRequest, res: Response) {
  try {
    const conversation = await getConversation(req.user!.userId, String(req.params.id));
    return res.json({ success: true, data: conversation });
  } catch (error) {
    return sendError(res, error, "CONVERSATION_GET_ERROR");
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    await deleteConversation(req.user!.userId, String(req.params.id));
    return res.json({ success: true });
  } catch (error) {
    return sendError(res, error, "CONVERSATION_DELETE_ERROR");
  }
}
