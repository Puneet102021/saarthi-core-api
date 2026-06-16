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