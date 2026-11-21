import { Router } from "express";

import {
  getOnboarding,
  submitOnboarding
} from "../controllers/onboarding.controller";

import {
  authenticate
} from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  submitOnboarding
);

router.get("/", authenticate, getOnboarding);

export default router;