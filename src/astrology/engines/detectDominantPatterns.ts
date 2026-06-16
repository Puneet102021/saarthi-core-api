import {
  HouseCluster
} from "./detectHouseClusters";

import {
  SignCluster
} from "./detectSignClusters";

import {
  Conjunction
} from "./detectConjunctions";

import {
  PlanetaryAspect
} from "./detectPlanetaryAspects";

export interface DominantPattern {

  type: string;

  source: Record<string, any>;

  linkedPlanets: string[];

  supportingPatterns: string[];
}

interface DetectDominantPatternsInput {

  houseClusters: HouseCluster[];

  signClusters: SignCluster[];

  conjunctions: Conjunction[];

  aspects: PlanetaryAspect[];
}

export function detectDominantPatterns({

  houseClusters,

  signClusters,

  conjunctions,

  aspects

}: DetectDominantPatternsInput): DominantPattern[] {

  const patterns:
    DominantPattern[] = [];

  /*
    HOUSE + SIGN
    reinforcement
  */

  for (
    const houseCluster
    of houseClusters
  ) {

    for (
      const signCluster
      of signClusters
    ) {

      const sharedPlanets =
        houseCluster.planets.filter(
          (planet) =>
            signCluster.planets.includes(
              planet
            )
        );

      if (
        sharedPlanets.length >= 2
      ) {

        patterns.push({

          type:
            "REINFORCED_CLUSTER",

          source: {

            house:
              houseCluster.house,

            sign:
              signCluster.sign
          },

          linkedPlanets:
            sharedPlanets,

          supportingPatterns: [

            "HOUSE_CLUSTER",

            "SIGN_CLUSTER"
          ]
        });
      }
    }
  }

  /*
    CONJUNCTION
    amplification
  */

  for (
    const conjunction
    of conjunctions
  ) {

    patterns.push({

      type:
        "CONJUNCTION_CLUSTER",

      source: {

        sign:
          conjunction.sign,

        house:
          conjunction.house,

        orb:
          conjunction.orb
      },

      linkedPlanets:
        conjunction.planets,

      supportingPatterns: [

        "CONJUNCTION"
      ]
    });
  }

  /*
    OPPOSITION
    structures
  */

  const oppositionAspects =
    aspects.filter(
      (aspect) =>
        aspect.aspect ===
        "Opposition"
    );

  for (
    const opposition
    of oppositionAspects
  ) {

    patterns.push({

      type:
        "AXIS_TENSION",

      source: {

        aspect:
          "Opposition",

        orb:
          opposition.orb
      },

      linkedPlanets: [

        opposition.planet1,

        opposition.planet2
      ],

      supportingPatterns: [

        "OPPOSITION"
      ]
    });
  }

  return patterns;
}