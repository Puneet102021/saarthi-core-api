import { Router } from "express";

import { clear, history } from "../controllers/chat.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, history);
router.delete("/", authenticate, clear);

export default router;
