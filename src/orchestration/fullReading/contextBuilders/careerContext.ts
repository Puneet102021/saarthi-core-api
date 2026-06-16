import {
  selectRelevantSymbols
} from "../../prioritizers/selectRelevantSymbols";

export function buildCareerContext(
  kernel: any
) {

  const relevant =
    selectRelevantSymbols({

      domain: "CAREER",

      kernel
    });

  const sunPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Sun"
    );

  const saturnPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Saturn"
    );

  const mercuryPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Mercury"
    );

  const jupiterPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Jupiter"
    );

  const rahuPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Rahu"
    );

  const tenthHouse =
    kernel.houses?.find(
      (h: any) => h.house === 10
    );

  const sixthHouse =
    kernel.houses?.find(
      (h: any) => h.house === 6
    );

  const eleventhHouse =
    kernel.houses?.find(
      (h: any) => h.house === 11
    );

  return {

    section:
      "CAREER",

    purpose:
      "Provide career-related symbolic evidence for interpretation.",

    symbolicEvaluation:
      kernel.symbolicEvaluation,

    coreCareerSignals: {

      sunPlacement,

      saturnPlacement,

      mercuryPlacement,

      jupiterPlacement,

      rahuPlacement,

      tenthHouse,

      sixthHouse,

      eleventhHouse
    },

    selectedCareerSignals:
      relevant,

    careerStructures: {

      dominantPatterns:
        kernel.dominantPatterns,

      axisActivations:
        kernel.axisActivations,

      houseClusters:
        kernel.houseClusters,

      signClusters:
        kernel.signClusters
    },

    supportingStructures: {

      dispositorChains:
        kernel.dispositorChains,

      activationPriority:
        kernel.activationPriority,

      conjunctions:
        kernel.conjunctions,

      planetaryAspects:
        kernel.planetaryAspects
    },

    timingFactors: {

      currentMahadasha:
        relevant.currentMahadasha,

      currentAntardasha:
        relevant.currentAntardasha,

      transitActivations:
        relevant.transitActivations
    },

    llmInstruction: {

      style:
        "Career interpretation grounded in symbolic evidence.",

      mustDo: [

        "Explain recurring work and achievement patterns.",

        "Discuss strengths and challenges supported by multiple signals.",

        "Discuss current timing influences.",

        "Use symbolic evidence before conclusions.",

        "Translate symbolism into practical career language."
      ],

      mustAvoid: [

        "Do not guarantee career success.",

        "Do not promise promotions, wealth, or fame.",

        "Do not force specific professions unless strongly supported.",

        "Do not make deterministic predictions.",

        "Do not create fear-based narratives.",

        "Do not explain astrology mechanics."
      ]
    }
  };
}