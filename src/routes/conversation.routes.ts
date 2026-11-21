import { Router } from "express";

import { get, list, remove } from "../controllers/conversation.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, list);
router.get("/:id", authenticate, get);
router.delete("/:id", authenticate, remove);

export default router;
