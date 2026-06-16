export function buildCoreInfluencesContext(
  kernel: any
) {

  const symbolicEvaluation =
    kernel.symbolicEvaluation || {};

  return {

    section:
      "CORE_INFLUENCES",

    purpose:
      "Explain recurring life patterns using symbolic evidence rather than astrology mechanics.",

    coreInfluenceSignals: {

      symbolicSummaries:
        symbolicEvaluation.symbolicSummaries || [],

      chartSignature:
        symbolicEvaluation.chartSignature || [],

      majorStructures:
        symbolicEvaluation.majorStructures || [],

      dominantYogas:
        symbolicEvaluation.dominantYogas || [],

      dominantDoshas:
        symbolicEvaluation.dominantDoshas || [],

      periodDrivers:
        symbolicEvaluation.periodDrivers || {}
    },

    llmInstruction: {

      style:
        "Evidence based life-pattern interpretation",

      mustDo: [

        "Use only supplied symbolic evidence.",

        "Focus on recurring patterns rather than isolated factors.",

        "Explain strengths supported by multiple signals.",

        "Explain challenges supported by multiple signals.",

        "Explain opportunities supported by multiple signals.",

        "Discuss active timing influences using periodDrivers.",

        "Translate symbolic patterns into practical life language.",

        "Identify themes that repeatedly appear across the evidence."
      ],

      mustAvoid: [

        "Do not explain planets.",

        "Do not explain signs.",

        "Do not explain houses.",

        "Do not explain yogas mechanically.",

        "Do not explain doshas mechanically.",

        "Do not discuss Ascendant.",

        "Do not discuss Ascendant Lord.",

        "Do not use textbook astrology meanings.",

        "Do not infer communication skills.",

        "Do not infer leadership ability.",

        "Do not infer intelligence.",

        "Do not infer charisma.",

        "Do not make claims unsupported by supplied evidence.",

        "Do not predict events.",

        "Do not provide remedies."
      ]
    }
  };
}