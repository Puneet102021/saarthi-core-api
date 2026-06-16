import {
  PlanetHousePlacement
} from "../builders/mapPlanetsToHouses";

import {
  HouseCluster
} from "./detectHouseClusters";

export interface AxisActivation {

  axis: string;

  houses: number[];

  activatedBy: string[];

  activationType: string;
}

const AXIS_PAIRS = [
  [1, 7],
  [2, 8],
  [3, 9],
  [4, 10],
  [5, 11],
  [6, 12]
];

function getAxisForHouse(
  house: number
): number[] | null {

  return AXIS_PAIRS.find(
    ([a, b]) =>
      a === house ||
      b === house
  ) || null;
}

function formatAxis(
  axis: number[]
): string {

  return `${axis[0]}-${axis[1]}`;
}

export function buildAxisActivations(

  placements: PlanetHousePlacement[],

  houseClusters: HouseCluster[]

): AxisActivation[] {

  const activations: AxisActivation[] = [];

  /*
    Nodal axis
  */

  const rahu =
    placements.find(
      p => p.planet === "Rahu"
    );

  const ketu =
    placements.find(
      p => p.planet === "Ketu"
    );

  if (
    rahu &&
    ketu
  ) {

    const axis =
      getAxisForHouse(
        rahu.house
      );

    if (axis) {

      activations.push({

        axis:
          formatAxis(axis),

        houses:
          axis,

        activatedBy: [
          "Rahu",
          "Ketu"
        ],

        activationType:
          "NODAL_AXIS"
      });
    }
  }

  /*
    House cluster axis
  */

  for (
    const cluster
    of houseClusters
  ) {

    const axis =
      getAxisForHouse(
        cluster.house
      );

    if (!axis) {
      continue;
    }

    activations.push({

      axis:
        formatAxis(axis),

      houses:
        axis,

      activatedBy:
        cluster.planets,

      activationType:
        "HOUSE_CLUSTER_AXIS"
    });
  }

  return activations;
}