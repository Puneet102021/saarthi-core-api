import {
  selectRelevantSymbols
} from "../../prioritizers/selectRelevantSymbols";

export function buildFinancialContext(kernel: any) {

    const relevant =
  selectRelevantSymbols({

    domain: "FINANCIAL",

    kernel
  });

  const jupiterPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Jupiter"
    );

  const venusPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Venus"
    );

  const saturnPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Saturn"
    );

  const rahuPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Rahu"
    );

  const secondHouse =
    kernel.houses?.find(
      (h: any) => h.house === 2
    );

  const eleventhHouse =
    kernel.houses?.find(
      (h: any) => h.house === 11
    );

  return {

    section:
      "FINANCIAL_PATTERNS_AND_MATERIAL_FLOW",

    purpose:
      "Explain wealth psychology and material flow patterns.",

    financialCore: {

      jupiterPlacement,

      venusPlacement,

      saturnPlacement,

      rahuPlacement,

      secondHouse,

      eleventhHouse
    },

    wealthStructures:
  relevant,

    materialBehavior: {

      planetaryState:
        kernel.planetaryState,

      houseClusters:
        kernel.houseClusters,

      signClusters:
        kernel.signClusters
    },

    prosperityDynamics: {

      axisActivations:
        kernel.axisActivations,

      dispositorChains:
        kernel.dispositorChains,

      activationPriority:
        kernel.activationPriority
    },

    financialTiming: {

  transitActivations:
    relevant.transitActivations,

  activationPriority:
    relevant.activationPriority
},

    relationalStructures: {

      conjunctions:
        kernel.conjunctions,

      planetaryAspects:
        kernel.planetaryAspects
    },

    llmInstruction: {

      style:
        "Grounded, realistic, psychologically aware, materially balanced.",

      mustDo: [

        "Explain money mindset and wealth accumulation behavior.",

        "Describe stability patterns, risk tendencies, and prosperity maturation.",

        "Explain material ambition and attachment structures.",

        "Use symbolic reinforcement and timing to explain WHY financial behaviors repeat."
      ],

      mustAvoid: [

        "Do not promise wealth or financial success.",

        "Do not make speculative investment predictions.",

        "Do not create fear-based poverty narratives.",

        "Do not reduce prosperity to simplistic yoga interpretation.",

        "Do not glorify materialism."
      ]
    }
  };
}