import { Router } from "express";

import { ask, askStream, previewAsk } from "../controllers/ask.controller";
import { authenticate } from "../middleware/auth.middleware";
import { devRoutesEnabled } from "./devRoutes";

const router = Router();

router.post("/", authenticate, ask);
router.post("/stream", authenticate, askStream);

if (devRoutesEnabled()) {
  router.post("/preview", previewAsk);
}

export default router;
