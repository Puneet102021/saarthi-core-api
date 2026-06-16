import {
  detectStructuralConvergence
} from "./detectStructuralConvergence";

import {
  buildSymbolicSummary
} from "../../orchestration/summarizers/symbolicSummaryBuilder";

import {
  themeSynthesizer
} from "./themeSynthesizer";

export function symbolicEvaluator(
  kernel: any
) {

  const dominantPlanets =
    extractDominantPlanets(
      kernel
    );

    const symbolicSummaries =
  (kernel.activationPriority || [])
    .slice(0, 5)
    .map(
      (activation: any) =>
        buildSymbolicSummary(
          activation
        )
    );

  const dominantYogas =
    extractDominantYogas(
      kernel
    );

  const dominantDoshas =
    extractDominantDoshas(
      kernel
    );

  const dominantHouses =
    extractDominantHouses(
      kernel
    );

  const dominantSigns =
    extractDominantSigns(
      kernel
    );

  const majorStructures =
    detectStructuralConvergence(
      kernel
    );

  const periodDrivers =
    extractPeriodDrivers(
      kernel
    );

  const chartSignature =
    buildChartSignature({

      dominantHouses,

      dominantSigns,

      dominantYogas,

      dominantDoshas,

      majorStructures
    });

    const recurringThemes =
  themeSynthesizer({

    symbolicSummaries,

    dominantYogas,

    dominantDoshas,

    majorStructures,

    chartSignature,

    periodDrivers,

  });

  return {

    dominantPlanets,

     symbolicSummaries,

    dominantYogas,

    dominantDoshas,

    dominantHouses,

    dominantSigns,

    majorStructures,

    periodDrivers,

    chartSignature,

    recurringThemes
  };
}

function extractDominantPlanets(
  kernel: any
) {

  return (
    kernel.activationPriority || []
  )
    .slice(0, 5)
    .map(
      (item: any) => ({

        planet:
          item.planet,

        priorityScore:
          item.priorityScore,

        reasons: [

          ...(item.prioritySources || []),

          ...(item.repeatedStructures || [])
        ]
      })
    );
}

function extractDominantYogas(
  kernel: any
) {

  return (
    kernel.detectedYogas || []
  )
    .filter(
      (y: any) =>
        y.detected
    );
}

function extractDominantDoshas(
  kernel: any
) {

  return (
    kernel.detectedDoshas || []
  )
    .filter(
      (d: any) =>
        d.detected
    );
}

function extractDominantHouses(
  kernel: any
) {

  return (
    kernel.houseActivations || []
  )
    .sort(
      (a: any, b: any) =>
        (b.activationScore || 0) -
        (a.activationScore || 0)
    )
    .slice(0, 5);
}

function extractDominantSigns(
  kernel: any
) {

  return (
    kernel.signClusters || []
  )
    .sort(
      (a: any, b: any) =>
        (b.planetCount || 0) -
        (a.planetCount || 0)
    )
    .slice(0, 5);
}

function extractPeriodDrivers(
  kernel: any
) {

  const currentMahadasha =
    kernel.mahadashaTimeline?.find(
      (d: any) => d.isCurrent
    );

  const currentAntardasha =
    kernel.antardashaTimeline?.find(
      (d: any) => d.isCurrent
    );

  return {

    mahadasha:
      currentMahadasha?.planet,

    antardasha:
      currentAntardasha?.planet
  };
}

function buildChartSignature(
  data: any
) {

  const signature: string[] = [];

  for (
    const structure
    of data.majorStructures || []
  ) {

    signature.push(
      structure.label
    );
  }

  for (
    const sign
    of data.dominantSigns || []
  ) {

    signature.push(
      `${sign.sign} cluster`
    );
  }

  for (
    const house
    of data.dominantHouses || []
  ) {

    signature.push(
      `House ${house.house} emphasis`
    );
  }

  for (
    const yoga
    of data.dominantYogas || []
  ) {

    signature.push(
      yoga.name
    );
  }

  for (
    const dosha
    of data.dominantDoshas || []
  ) {

    signature.push(
      dosha.name
    );
  }

  return signature
    .slice(0, 15);
}