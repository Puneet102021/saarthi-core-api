import { Request, Response } from "express";

import { buildNatalChart } from "../astrology/chart";
import { dashaAt, describePeriod } from "../astrology/dasha";
import { transitSnapshot } from "../astrology/transits";
import type { BirthInput, NatalChart } from "../astrology/types";
import { AuthRequest } from "../middleware/auth.middleware";
import { getUserChart, ProfileIncompleteError } from "../services/chartService";

export class BadRequestError extends Error {}

/* Birth details from a request body, for the developer preview routes. */
export function parseBirthInput(body: any): BirthInput {
  const birth = body?.birth;

  if (!birth || typeof birth !== "object") {
    throw new BadRequestError("Body must include birth: { date, time, timezone, latitude, longitude }");
  }

  const latitude = Number(birth.latitude);
  const longitude = Number(birth.longitude);

  if (typeof birth.date !== "string") throw new BadRequestError("birth.date must be YYYY-MM-DD");
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) throw new BadRequestError("birth.latitude is invalid");
  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) throw new BadRequestError("birth.longitude is invalid");

  const utcOffsetMinutes =
    birth.utcOffsetMinutes === undefined ? undefined : Number(birth.utcOffsetMinutes);

  if (!birth.timezone && !Number.isFinite(utcOffsetMinutes)) {
    throw new BadRequestError("birth.timezone (IANA, e.g. Asia/Kolkata) or birth.utcOffsetMinutes is required");
  }

  return {
    date: birth.date,
    time: typeof birth.time === "string" && birth.time.trim() ? birth.time : null,
    timezone: birth.timezone,
    utcOffsetMinutes,
    latitude,
    longitude
  };
}

export function chartView(chart: NatalChart, now = new Date()) {
  const running = dashaAt(chart.dasha.mahadashas, now);

  return {
    chart,
    now: {
      date: now.toISOString(),
      period: running
        ? {
            label: describePeriod(running.pratyantardasha),
            mahadasha: running.mahadasha,
            antardasha: running.antardasha,
            pratyantardasha: running.pratyantardasha
          }
        : null,
      transits: transitSnapshot(chart, now)
    }
  };
}

export function sendError(res: Response, error: unknown, tag: string) {
  if (error instanceof BadRequestError || error instanceof ProfileIncompleteError) {
    return res.status(400).json({ success: false, error: error.message });
  }

  /* Bad dates and times surface from the time parser as plain errors with a clear message. */
  if (error instanceof Error && /^Birth (date|time)|Invalid (birth|12-hour)|timezone/i.test(error.message)) {
    return res.status(400).json({ success: false, error: error.message });
  }

  console.error(tag, error);
  return res.status(500).json({ success: false, error: "Internal server error" });
}

export async function getMyChart(req: AuthRequest, res: Response) {
  try {
    const { chart } = await getUserChart(req.user!.userId);
    return res.json({ success: true, data: chartView(chart) });
  } catch (error) {
    return sendError(res, error, "CHART_ERROR");
  }
}

export async function previewChart(req: Request, res: Response) {
  try {
    const chart = buildNatalChart(parseBirthInput(req.body));
    return res.json({ success: true, data: chartView(chart) });
  } catch (error) {
    return sendError(res, error, "CHART_PREVIEW_ERROR");
  }
}
