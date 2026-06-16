import {
  selectRelevantSymbols
} from "../../prioritizers/selectRelevantSymbols";

export function buildKarmicContext(kernel: any) {

    const relevant =
  selectRelevantSymbols({

    domain: "KARMA",

    kernel
  });

  const rahuPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Rahu"
    );

  const ketuPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Ketu"
    );

  const saturnPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Saturn"
    );

  const jupiterPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Jupiter"
    );

  const twelfthHouse =
    kernel.houses?.find(
      (h: any) => h.house === 12
    );

  const eighthHouse =
    kernel.houses?.find(
      (h: any) => h.house === 8
    );

  return {

    section:
      "KARMIC_AND_EVOLUTIONARY_PATTERNS",

    purpose:
      "Explain recurring karmic themes and evolutionary soul-patterns.",

    karmicCore: {

      rahuPlacement,

      ketuPlacement,

      saturnPlacement,

      jupiterPlacement,

      twelfthHouse,

      eighthHouse
    },

    karmicStructures:
  relevant,

    evolutionaryPressure: {

  planetaryState:
    relevant.planetaryState
},

    karmicRepetition: {

      dispositorChains:
        kernel.dispositorChains,

      conjunctions:
        kernel.conjunctions,

      planetaryAspects:
        kernel.planetaryAspects,

      transitActivations:
        kernel.transitActivations
    },

    karmicTiming: {

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
        "Spiritually grounded, psychologically deep, calm, mature, non-dogmatic.",

      mustDo: [

        "Explain recurring karmic themes and life lessons.",

        "Describe attachment patterns, spiritual tensions, and evolutionary growth.",

        "Explain WHY certain patterns repeatedly emerge in life.",

        "Frame karma as growth and awareness, not punishment."
      ],

      mustAvoid: [

        "Do not create fatalistic destiny narratives.",

        "Do not claim certainty about past lives.",

        "Do not use fear-based karmic language.",

        "Do not portray suffering as divine punishment.",

        "Do not create mystical superiority narratives."
      ]
    }
  };
}