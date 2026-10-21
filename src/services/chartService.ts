import type { UserProfile } from "@prisma/client";

import { buildNatalChart, ENGINE_VERSION } from "../astrology/chart";
import type { BirthInput, NatalChart } from "../astrology/types";
import { prisma } from "../lib/prisma";

export class ProfileIncompleteError extends Error {}

export function birthInputFromProfile(profile: UserProfile): BirthInput {
  if (!profile.birthDate || profile.latitude == null || profile.longitude == null) {
    throw new ProfileIncompleteError("Birth date and place are needed to build the chart");
  }

  if (!profile.timezone) {
    throw new ProfileIncompleteError("The birth place has no timezone");
  }

  /* birthDate is stored as UTC midnight of the local calendar date. */
  const date = profile.birthDate.toISOString().slice(0, 10);

  const time = profile.birthTimeKnown && profile.birthTime?.trim() ? profile.birthTime.trim() : null;

  return {
    date,
    time,
    timezone: profile.timezone,
    latitude: profile.latitude,
    longitude: profile.longitude
  };
}

interface StoredChart {
  engineVersion: number;
  input: BirthInput;
  chart: NatalChart;
}

/*
  The natal chart is computed once and kept in UserChart. It is rebuilt when
  the birth details change or the engine version moves on.
*/
export async function getUserChart(userId: string): Promise<{ chart: NatalChart; name: string | null }> {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });

  if (!profile) {
    throw new ProfileIncompleteError("Complete onboarding first");
  }

  const input = birthInputFromProfile(profile);

  const stored = await prisma.userChart.findUnique({ where: { userId } });
  const data = stored?.chartData as unknown as StoredChart | undefined;

  if (
    data &&
    data.engineVersion === ENGINE_VERSION &&
    JSON.stringify(data.input) === JSON.stringify(input)
  ) {
    return { chart: data.chart, name: profile.fullName };
  }

  const chart = buildNatalChart(input);
  const chartData = { engineVersion: ENGINE_VERSION, input, chart } as unknown as object;

  await prisma.userChart.upsert({
    where: { userId },
    update: { chartData },
    create: { userId, chartData }
  });

  return { chart, name: profile.fullName };
}
