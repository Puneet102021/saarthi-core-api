import { buildChartKernel } from "./buildChartKernel";
import { buildTimelineKernel } from "./buildTimelineKernel";
import { buildStructuresKernel } from "./buildStructuresKernel";
import { buildPlanetaryStateKernel } from "./buildPlanetaryStateKernel";
import { buildThemesKernel } from "./buildThemesKernel";

export async function buildUserKernel(
  chartData: any
) {

  const chart =
    await buildChartKernel(
      chartData
    );

  const timeline =
    await buildTimelineKernel(
      chartData.timeline
    );

  const structures =
    await buildStructuresKernel(
      chartData.yogas,
      chartData.doshas,
      chartData.patterns
    );

  const planetaryState =
    await buildPlanetaryStateKernel(
      chartData.planetaryState
    );

  const themes =
    await buildThemesKernel(
      chartData.themes
    );

  return {

    userId:
      chartData.userId,

    generatedAt:
      new Date().toISOString(),

    chart,

    timeline,

    structures,

    planetaryState,

    themes
  };
}