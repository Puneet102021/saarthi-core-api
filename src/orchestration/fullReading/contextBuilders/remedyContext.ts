import {
  selectRelevantSymbols
} from "../../prioritizers/selectRelevantSymbols";

export function buildRemedyContext(kernel: any) {

    const relevant =
  selectRelevantSymbols({

    domain: "REMEDIES",

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
      "REMEDY_AND_GROUNDING_GUIDANCE",

    purpose:
      "Provide stabilizing, grounding, and spiritually supportive guidance based on symbolic pressure patterns.",

    activePressureSystems:
  relevant,

    karmicPressure: {

      dominantPatterns:
        kernel.dominantPatterns,

      reinforcementGraph:
        kernel.reinforcementGraph,

      axisActivations:
        kernel.axisActivations,

      dispositorChains:
        kernel.dispositorChains
    },

   activeTiming: {

  currentMahadasha:
    relevant.currentMahadasha,

  currentAntardasha:
    relevant.currentAntardasha
},

    groundingSignals: {

      conjunctions:
        kernel.conjunctions,

      planetaryAspects:
        kernel.planetaryAspects,

      houseClusters:
        kernel.houseClusters,

      signClusters:
        kernel.signClusters
    },

    remedyPhilosophy: {

      primaryApproach: [

        "Grounding before mystical escalation",

        "Behavioral correction before dependency-based remedies",

        "Spiritual consistency over fear-based intervention",

        "Low-cost and psychologically stabilizing remedies first"
      ],

      preferredRemedies: [

        "Meditation",

        "Breathwork",

        "Journaling",

        "Routine stabilization",

        "Hanuman Chalisa",

        "Seva",

        "Daan",

        "Temple visits",

        "Mindfulness",

        "Sleep regulation",

        "Emotional grounding",

        "Physical discipline"
      ],

      escalationTriggers: [

        "Long-duration symbolic pressure",

        "Repeated karmic reinforcement",

        "Severe emotional destabilization",

        "Major transit convergence",

        "Strong Saturn/Rahu/Ketu pressure"
      ],

      advancedRemedies: [

        "Gemstones",

        "Yantras",

        "Poojas",

        "Mantra sadhana",

        "Spiritual mentorship"
      ]
    },

    llmInstruction: {

      style:
        "Grounded, compassionate, stabilizing, spiritually mature, psychologically responsible.",

      mustDo: [

        "Suggest remedies as supportive alignment tools, not magical fixes.",

        "Prioritize grounding and emotional stabilization first.",

        "Explain WHY certain remedies symbolically help.",

        "Keep recommendations practical, accessible, and emotionally stabilizing."
      ],

      mustAvoid: [

        "Do not use fear-based remedy language.",

        "Do not create dependency on rituals or astrologers.",

        "Do not prescribe expensive remedies unnecessarily.",

        "Do not portray remedies as guaranteed outcomes.",

        "Do not exploit emotional vulnerability."
      ]
    }
  };
}