export async function buildChartKernel(
  chart: any
) {

  return {

    ascendant:
      chart.ascendant?.sign,

    lagnesh:
      chart.ascendant?.ruler,

    sunSign:
      chart.sun?.sign,

    moonSign:
      chart.moon?.sign,

    nakshatra:
      chart.moon?.nakshatra,

    planets:
      chart.planets,

    houses:
      chart.houses
  };
}