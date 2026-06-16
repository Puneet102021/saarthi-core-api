import {
  selectRelevantSymbols
} from "../../prioritizers/selectRelevantSymbols";

export function buildPersonalityContext(kernel: any) {

    const relevant =
  selectRelevantSymbols({

    domain: "PERSONALITY",

    kernel
  });

  const ascendant =
    kernel.ascendant;

  const lagnaLord =
    kernel.houseLords?.find(
      (h: any) => h.house === 1
    );

  const moonPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Moon"
    );

  const sunPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Sun"
    );

  const mercuryPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Mercury"
    );

  return {

    section:
      "PERSONALITY_STRUCTURE",

    purpose:
      "Explain the native's core personality architecture.",

    coreIdentity: {

      ascendant,

      lagnaLord,

      moonPlacement,

      sunPlacement,

      mercuryPlacement
    },

    psychologicalStructures:
  relevant,

    personalityDrivers: { conjunctions: relevant.conjunctions, planetaryAspects: relevant.planetaryAspects, axisActivations: relevant.axisActivations },

    activePsychologicalTiming: {

      activationPriority:
        kernel.activationPriority,

      currentMahadasha:
        kernel.mahadashaTimeline?.find(
          (d: any) => d.isCurrent
        ),

      currentAntardasha:
        kernel.antardashaTimeline?.find(
          (d: any) => d.isCurrent
        )
    },

    llmInstruction: {

      style:
        "Psychologically deep, emotionally realistic, grounded in astrology.",

      mustDo: [

        "Explain how identity, confidence, emotional nature, and thinking style are formed.",

        "Describe internal contradictions and reinforcement patterns.",

        "Use symbolic structures to explain WHY traits exist.",

        "Keep the narrative psychologically coherent and human."
      ],

      mustAvoid: [

        "Do not reduce personality to sun-sign stereotypes.",

        "Do not make deterministic life predictions.",

        "Do not use generic motivational language.",

        "Do not create unsupported psychological claims."
      ]
    }
  };
}