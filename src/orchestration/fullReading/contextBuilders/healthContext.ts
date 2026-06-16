import {
  selectRelevantSymbols
} from "../../prioritizers/selectRelevantSymbols";

export function buildHealthContext(kernel: any) {

    const relevant =
  selectRelevantSymbols({

    domain: "HEALTH",

    kernel
  });

  const moonPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Moon"
    );

  const sunPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Sun"
    );

  const marsPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Mars"
    );

  const saturnPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Saturn"
    );

  const sixthHouse =
    kernel.houses?.find(
      (h: any) => h.house === 6
    );

  const eighthHouse =
    kernel.houses?.find(
      (h: any) => h.house === 8
    );

  const twelfthHouse =
    kernel.houses?.find(
      (h: any) => h.house === 12
    );

  return {

    section:
      "HEALTH_ENERGY_AND_RECOVERY_PATTERNS",

    purpose:
      "Explain vitality, stress handling, and recovery tendencies.",

    vitalityCore: {

      moonPlacement,

      sunPlacement,

      marsPlacement,

      saturnPlacement,

      sixthHouse,

      eighthHouse,

      twelfthHouse
    },

    stressStructures:
  relevant,


energyDynamics: {

  planetaryState:
    relevant.healthPlanets,

  transitActivations:
    relevant.transitActivations
},


    recoveryPatterns: {

      dispositorChains:
        kernel.dispositorChains,

      conjunctions:
        kernel.conjunctions,

      planetaryAspects:
        kernel.planetaryAspects
    },

    activeHealthTiming: {

      currentMahadasha:
        kernel.mahadashaTimeline?.find(
          (d: any) => d.isCurrent
        ),

      currentAntardasha:
        kernel.antardashaTimeline?.find(
          (d: any) => d.isCurrent
        ),

      transitActivations:
        kernel.transitActivations
    },

    llmInstruction: {

      style:
        "Grounded, stabilizing, health-conscious, psychologically responsible.",

      mustDo: [

        "Explain energy management and stress patterns.",

        "Describe recovery tendencies and burnout cycles.",

        "Explain psychosomatic pressure and emotional exhaustion patterns carefully.",

        "Encourage grounding, balance, rest, and sustainable lifestyle awareness."
      ],

      mustAvoid: [

        "Do not diagnose diseases or medical conditions.",

        "Do not predict death, severe illness, or catastrophe.",

        "Do not create fear-based health narratives.",

        "Do not exaggerate symbolic afflictions into medical certainty.",

        "Do not discourage medical consultation when needed."
      ]
    }
  };
}