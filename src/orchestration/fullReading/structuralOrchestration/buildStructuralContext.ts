export function buildStructuralContext(input: any) {
  const {
    activationPriority = [],
    planetaryStates = [],
    transitActivations = [],
    dashaTimeline = [],
    supportGraph = [],
    tensionGraph = [],
    axisActivations = [],
    signClusters = [],
    houseActivations = []
  } = input;

  return {
    dominantActivations: getDominantActivations(activationPriority),
    activeTimingFactors: getActiveTimingFactors(dashaTimeline, transitActivations),
    highPressureStructures: getHighPressureStructures(tensionGraph),
    highSupportStructures: getHighSupportStructures(supportGraph),
    repeatedStructures: getRepeatedStructures(activationPriority),
    activeHouses: getActiveHouses(houseActivations),
    activeSigns: getActiveSigns(signClusters),
    axisActivations: getAxisActivations(axisActivations),
    rawReference: {
      planetaryStates,
      activationPriority,
      transitActivations,
      dashaTimeline,
      supportGraph,
      tensionGraph
    }
  };
}

function getDominantActivations(items: any[]) {
  return items
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    .slice(0, 8)
    .map(item => ({
      planet: item.planet,
      priorityScore: item.priorityScore,
      prioritySources: item.prioritySources || [],
      symbolicFlags: item.symbolicFlags || [],
      repeatedStructures: item.repeatedStructures || []
    }));
}

function getActiveTimingFactors(dashas: any[], transits: any[]) {
  return {
    dasha: dashas?.slice?.(0, 3) || [],
    transits: transits
      ?.filter(t => t.activationLevel === "HIGH" || t.priorityScore >= 7)
      ?.slice(0, 8) || []
  };
}

function getHighPressureStructures(tensionGraph: any[]) {
  return tensionGraph
    .filter(item => item.intensity === "HIGH" || item.score >= 7)
    .slice(0, 10);
}

function getHighSupportStructures(supportGraph: any[]) {
  return supportGraph
    .filter(item => item.intensity === "HIGH" || item.score >= 7)
    .slice(0, 10);
}

function getRepeatedStructures(items: any[]) {
  const map: Record<string, number> = {};

  for (const item of items) {
    for (const structure of item.repeatedStructures || []) {
      map[structure] = (map[structure] || 0) + 1;
    }
  }

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([structure, count]) => ({
      structure,
      count
    }));
}

function getActiveHouses(houses: any[]) {
  return houses
    .sort((a, b) => (b.activationScore || 0) - (a.activationScore || 0))
    .slice(0, 6);
}

function getActiveSigns(signs: any[]) {
  return signs
    .filter(s => s.planetCount > 1)
    .sort((a, b) => b.planetCount - a.planetCount);
}

function getAxisActivations(axes: any[]) {
  return axes
    .filter(axis => axis.activationScore >= 5 || axis.intensity === "HIGH")
    .slice(0, 6);
}