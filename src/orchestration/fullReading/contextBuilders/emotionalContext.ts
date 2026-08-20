import {
  selectRelevantSymbols
} from "../../prioritizers/selectRelevantSymbols";

export function buildEmotionalContext(kernel: any) {

    const relevant: any =
  selectRelevantSymbols({

    domain: "EMOTIONAL",

    kernel
  });

  const moonPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Moon"
    );

  const mercuryPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Mercury"
    );

  const saturnPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Saturn"
    );

  const rahuPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Rahu"
    );

  return {

    section:
      "EMOTIONAL_AND_MENTAL_ARCHITECTURE",

    purpose:
      "Explain how the native emotionally processes life internally.",

    emotionalCore: {

      moonPlacement,

      mercuryPlacement,

      saturnPlacement,

      rahuPlacement,

      ascendant:
        kernel.ascendant
    },

    emotionalStructures:
  relevant,

    psychologicalPressure: {

  planetaryState:
    relevant.emotionalPlanets,

  activationPriority:
    relevant.activationPriority,

  transitActivations:
    relevant.transitActivations
},

    emotionalTiming: {

      currentMahadasha:
        kernel.mahadashaTimeline?.find(
          (d: any) => d.isCurrent
        ),

      currentAntardasha:
        kernel.antardashaTimeline?.find(
          (d: any) => d.isCurrent
        )
    },

    symbolicDrivers: {

      dispositorChains:
        kernel.dispositorChains,

      conjunctions:
        kernel.conjunctions,

      planetaryAspects:
        kernel.planetaryAspects
    },

    llmInstruction: {

      style:
        "Emotionally intelligent, psychologically realistic, grounded and compassionate.",

      mustDo: [

        "Explain emotional processing patterns and internal experience.",

        "Describe stress response, overthinking, emotional endurance, and emotional contradictions.",

        "Explain WHY emotional tendencies emerge from symbolic structures.",

        "Keep the reading psychologically stabilizing and emotionally mature."
      ],

      mustAvoid: [

        "Do not use fear-based mental health language.",

        "Do not diagnose disorders.",

        "Do not create deterministic suffering narratives.",

        "Do not exaggerate emotional difficulty for dramatic effect."
      ]
    }
  };
}