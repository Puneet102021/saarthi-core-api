import "dotenv/config";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import locationRoutes
from "./routes/location.routes";

import chartRoutes
from "./routes/chart.routes";

import authRoutes from "./routes/auth.routes";

import onboardingRoutes
from "./routes/onboarding.routes";

dotenv.config();

const app =
  express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET","POST","PUT","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"]
  })
);

app.use(
  express.json()
);

app.use(
  "/api/chart",
  chartRoutes
);

app.use("/auth", authRoutes);

app.use(
  "/api/locations",
  locationRoutes
);

app.use(
  "/api/onboarding",
  onboardingRoutes
);

app.get(
  "/",
  (_req, res) => {
    res.json({
      success: true,
      message: "Saarthi Core API running"
    });
  }
);

const PORT =
  Number(process.env.PORT) || 4100;

app.listen(
  PORT,
  () => {
    console.log(
      `Saarthi Core API running on port ${PORT}`
    );
  }
);