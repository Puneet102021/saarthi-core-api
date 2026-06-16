export async function buildPlanetaryStateKernel(
  planetaryState: any
) {

  return {

    supportive:
      planetaryState.supportive || [],

    challenging:
      planetaryState.challenging || [],

    neutral:
      planetaryState.neutral || []
  };
}