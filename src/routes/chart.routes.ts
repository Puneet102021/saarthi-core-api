import { Router } from "express";

import { getMyChart, previewChart } from "../controllers/chart.controller";
import { authenticate } from "../middleware/auth.middleware";
import { devRoutesEnabled } from "./devRoutes";

const router = Router();

router.get("/", authenticate, getMyChart);

if (devRoutesEnabled()) {
  router.post("/preview", previewChart);
}

export default router;
