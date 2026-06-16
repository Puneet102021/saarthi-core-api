import {
  selectRelevantSymbols
} from "../../prioritizers/selectRelevantSymbols";

export function buildSynthesisContext(kernel: any) {

  const personalityRelevant =
    selectRelevantSymbols({

      domain: "PERSONALITY",

      kernel
    });

  const emotionalRelevant =
    selectRelevantSymbols({

      domain: "EMOTIONAL",

      kernel
    });

  const careerRelevant =
    selectRelevantSymbols({

      domain: "CAREER",

      kernel
    });

  const relationshipRelevant =
    selectRelevantSymbols({

      domain: "RELATIONSHIP",

      kernel
    });

  const karmicRelevant =
    selectRelevantSymbols({

      domain: "KARMA",

      kernel
    });

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
      "WHOLE_LIFE_SYMBOLIC_SYNTHESIS",

    purpose:
      "Integrate all symbolic systems into a coherent life architecture narrative.",

    identityCore: {

      ascendant:
        kernel.ascendant,

      personality:
        personalityRelevant,

      emotional:
        emotionalRelevant
    },

    structuralDynamics: {

      career:
        careerRelevant,

      relationship:
        relationshipRelevant,

      karmic:
        karmicRelevant
    },

    symbolicPressure: {

      activationPriority:
        kernel.activationPriority,

      currentMahadasha,

      currentAntardasha,

      transitActivations:
        kernel.transitActivations
    },

    lifeProgression: {

      currentMahadasha,

      currentAntardasha
    },

    karmicEvolution: {

      karmic:
        karmicRelevant,

      recurringStructures:
        kernel.dominantPatterns
    },

    llmInstruction: {

      style:
        "Wise, integrated, reflective, emotionally mature, spiritually grounded.",

      mustDo: [

        "Integrate the chart into a coherent life narrative.",

        "Explain how personality, karma, relationships, work, emotions, and timing interconnect.",

        "Describe recurring life themes and symbolic evolution patterns.",

        "Explain strengths, tensions, growth paths, and spiritual maturation realistically.",

        "End with grounded insight and constructive direction."
      ],

      mustAvoid: [

        "Do not create deterministic destiny narratives.",

        "Do not exaggerate suffering or greatness.",

        "Do not create mystical superiority language.",

        "Do not promise outcomes or certainty.",

        "Do not repeat raw astrological data excessively."
      ]
    }
  };
}
