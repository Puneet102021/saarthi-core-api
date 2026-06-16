import {
  selectRelevantSymbols
} from "../../prioritizers/selectRelevantSymbols";

export function buildBehavioralContext(kernel: any) {

  const mercuryPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Mercury"
    );

  const marsPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Mars"
    );

  const moonPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Moon"
    );

  const saturnPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Saturn"
    );

  return {

    section:
      "BEHAVIORAL_AND_SOCIAL_DYNAMICS",

    purpose:
      "Explain real-world behavior and social functioning.",

    behavioralCore: {

      mercuryPlacement,

      marsPlacement,

      moonPlacement,

      saturnPlacement,

      ascendant:
        kernel.ascendant
    },

    communicationStructures: {

      supportTensionGraph:
        kernel.supportTensionGraph,

      conjunctions:
        kernel.conjunctions,

      planetaryAspects:
        kernel.planetaryAspects
    },

    behavioralPatterns: {

      dominantPatterns: kernel.dominantPatterns,

      reinforcementGraph:
        kernel.reinforcementGraph,

      houseClusters:
        kernel.houseClusters,

      signClusters:
        kernel.signClusters
    },

    socialDynamics: {

      axisActivations:
        kernel.axisActivations,

      dispositorChains:
        kernel.dispositorChains,

      planetaryState:
        kernel.planetaryState
    },

    activeBehavioralTiming: {

      activationPriority:
        kernel.activationPriority,

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
        "Human, observational, psychologically realistic, socially grounded.",

      mustDo: [

        "Explain communication style and behavioral functioning.",

        "Describe conflict patterns, trust dynamics, and social adaptation.",

        "Explain differences between public and private behavior.",

        "Use symbolic reinforcement and tensions to explain WHY behaviors repeat."
      ],

      mustAvoid: [

        "Do not create moral judgments.",

        "Do not use exaggerated personality labels.",

        "Do not reduce behavior to stereotypes.",

        "Do not create deterministic social outcomes."
      ]
    }
  };
}