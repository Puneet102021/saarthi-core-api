import { Response } from "express";

import { FactNotFoundError, forgetAll, forgetFact, memoryView } from "../memory/store";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendError } from "./chart.controller";

/* GET /api/memory: what Saarthi remembers (long-term notes and the running summary). */
export async function getMemory(req: AuthRequest, res: Response) {
  try {
    return res.json({ success: true, data: await memoryView(req.user!.userId) });
  } catch (error) {
    return sendError(res, error, "MEMORY_GET_ERROR");
  }
}

/* DELETE /api/memory/facts/:id: forget one note. */
export async function deleteFact(req: AuthRequest, res: Response) {
  try {
    await forgetFact(req.user!.userId, String(req.params.id));
    return res.json({ success: true });
  } catch (error) {
    if (error instanceof FactNotFoundError) return res.status(404).json({ success: false, error: error.message });
    return sendError(res, error, "MEMORY_DELETE_ERROR");
  }
}

/* DELETE /api/memory: forget everything (notes and summary); the chat itself stays. */
export async function deleteMemory(req: AuthRequest, res: Response) {
  try {
    await forgetAll(req.user!.userId);
    return res.json({ success: true });
  } catch (error) {
    return sendError(res, error, "MEMORY_CLEAR_ERROR");
  }
}
