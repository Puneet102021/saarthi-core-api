import {
  selectRelevantSymbols
} from "../../prioritizers/selectRelevantSymbols";

export function buildRelationshipContext(kernel: any) {

    const relevant =
  selectRelevantSymbols({

    domain: "RELATIONSHIP",

    kernel
  });

  const venusPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Venus"
    );

  const moonPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Moon"
    );

  const marsPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Mars"
    );

  const jupiterPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Jupiter"
    );

  const rahuPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Rahu"
    );

  const ketuPlacement =
    kernel.placements?.find(
      (p: any) => p.planet === "Ketu"
    );

  const seventhHouse =
    kernel.houses?.find(
      (h: any) => h.house === 7
    );

  return {

    section:
      "RELATIONSHIP_AND_MARRIAGE_DYNAMICS",

    purpose:
      "Explain emotional bonding patterns and karmic relationship lessons.",

    relationalCore: {

      venusPlacement,

      moonPlacement,

      marsPlacement,

      jupiterPlacement,

      rahuPlacement,

      ketuPlacement,

      seventhHouse
    },

    emotionalBondingStructures:
  relevant,

    relationshipPatterns: {

      dominantPatterns:
        kernel.dominantPatterns,

      houseClusters:
        kernel.houseClusters,

      signClusters:
        kernel.signClusters,

      axisActivations:
        kernel.axisActivations
    },

    karmicRelationshipStructures: {

      dispositorChains:
        kernel.dispositorChains,

      planetaryState:
        kernel.planetaryState,

      activationPriority:
        kernel.activationPriority
    },

    activeRelationshipTiming: {

  currentMahadasha:
    relevant.currentMahadasha,

  transitActivations:
    relevant.transitActivations
},
    llmInstruction: {

      style:
        "Emotionally intelligent, mature, psychologically nuanced, karmically grounded.",

      mustDo: [

        "Explain attachment patterns and emotional bonding style.",

        "Describe relationship strengths, vulnerabilities, and karmic lessons.",

        "Explain emotional trust patterns and relational contradictions.",

        "Use symbolic structures to explain WHY relationship dynamics repeat."
      ],

      mustAvoid: [

        "Do not create fear-based marriage predictions.",

        "Do not claim certainty about divorce, betrayal, or suffering.",

        "Do not create soulmate fantasy narratives.",

        "Do not use deterministic compatibility claims.",

        "Do not shame emotional vulnerability."
      ]
    }
  };
}