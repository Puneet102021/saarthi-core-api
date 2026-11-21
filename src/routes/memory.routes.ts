import { Router } from "express";

import { deleteFact, deleteMemory, getMemory } from "../controllers/memory.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getMemory);
router.delete("/", authenticate, deleteMemory);
router.delete("/facts/:id", authenticate, deleteFact);

export default router;
