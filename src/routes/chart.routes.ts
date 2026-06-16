import { Router }
from "express";

import {
  getRawChart
}
from "../controllers/chart.controller";

import {
  getHouseTest
} from "../controllers/chart.controller";

const router =
  Router();

router.get(
  "/raw",
  getRawChart
);

router.get(
  "/houses",
  getHouseTest
);

export default router;