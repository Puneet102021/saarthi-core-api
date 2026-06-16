import {
  selectRelevantSymbols
} from "../../prioritizers/selectRelevantSymbols";

export function buildTimelineContext(kernel: any) {

    const relevant =
  selectRelevantSymbols({

    domain: "TIMELINE",

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
      "LIFE_TIMELINE_AND_SYMBOLIC_PHASES",

    purpose:
      "Explain symbolic life progression through planetary timing systems.",

    timelineCore:
  relevant,

    activePhaseDynamics: {

  activationPriority:
    relevant.activationPriority,

  transitActivations:
    relevant.transitActivations
},

    recurringThemes: {

      dominantPatterns:
        kernel.dominantPatterns,

      reinforcementGraph:
        kernel.reinforcementGraph,

      axisActivations:
        kernel.axisActivations,

      supportTensionGraph:
        kernel.supportTensionGraph
    },

    symbolicTransitions: {

      dispositorChains:
        kernel.dispositorChains,

      conjunctions:
        kernel.conjunctions,

      planetaryAspects:
        kernel.planetaryAspects
    },

    llmInstruction: {

      style:
        "Reflective, insightful, temporally aware, psychologically mature.",

      mustDo: [

        "Explain how different life phases activate different symbolic systems.",

        "Describe shifts in identity, priorities, emotional patterns, and external pressures over time.",

        "Explain WHY certain phases felt expansive, restrictive, intense, or transformative.",

        "Frame timing as symbolic activation, not deterministic fate."
      ],

      mustAvoid: [

        "Do not create exact event predictions.",

        "Do not create fear around future periods.",

        "Do not portray difficult periods as punishment.",

        "Do not guarantee future outcomes.",

        "Do not exaggerate transit or dasha effects dramatically."
      ]
    }
  };
}