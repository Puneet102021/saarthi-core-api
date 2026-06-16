export function buildTechnicalOverviewContext(
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

    section:
      "TECHNICAL_CHART_OVERVIEW",

    purpose:
      "Introduce the chart structure before any interpretation begins.",

    chartIdentity: {

      ascendant:
        kernel.ascendant,

      ascendantLord:
        kernel.ascendantLord,

      sun:
        kernel.placements?.find(
          (p: any) => p.planet === "Sun"
        ),

      moon:
        kernel.placements?.find(
          (p: any) => p.planet === "Moon"
        )
    },

    symbolicEvaluation:
  kernel.symbolicEvaluation,

    chartStructure: {

      signClusters:
        kernel.signClusters,

      houseClusters:
        kernel.houseClusters,

      dominantPlanets:
        kernel.activationPriority
          ?.slice(0, 5),

          

      majorConjunctions:
        kernel.conjunctions,

      majorAspects:
        kernel.planetaryAspects
          ?.filter(
            (a: any) =>
              a.orb <= 5
          )
    },

    yogas:
      kernel.detectedYogas || [],

    doshas:
      kernel.detectedDoshas || [],

    timingSnapshot: {

      currentMahadasha,

      currentAntardasha
    },

    llmInstruction: {

      style:
        "Conversational chart observation",

      mustDo: [

        "Review symbolicEvaluation before reviewing raw chart structure.",

        "Start with chartSignature and majorStructures if present.",

        "Use raw placements only as supporting evidence.",

        "Start with Ascendant and Ascendant Lord.",

        "Mention Sun and Moon naturally.",

        "Mention major chart clusters.",

        "Mention dominant planets.",

        "Mention important yogas if present.",

        "Mention important doshas if present.",

        "Mention current Mahadasha and Antardasha.",

        "Explain what immediately catches your attention in the chart.",

        "Stay in observation mode."
      ],

      mustAvoid: [

        "Do not perform personality analysis.",

        "Do not perform emotional analysis.",

        "Do not perform relationship analysis.",

        "Do not perform career analysis.",

        "Do not provide predictions.",

        "Do not provide remedies.",

        "Do not infer psychology.",

        "Do not use report formatting.",

        "Do not use bullet points.",

        "Do not use headings.",

        "Do not explain what placements mean."
      ]
    }
  };
}