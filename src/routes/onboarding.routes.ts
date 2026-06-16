import { Router } from "express";

import {
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

export default router;