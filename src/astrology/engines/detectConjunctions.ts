import {
  PlanetPosition
} from "../calculators/calculatePlanetaryPositions";

import {
  PlanetHousePlacement
} from "../builders/mapPlanetsToHouses";

export interface Conjunction {

  planets: string[];

  orb: number;

  sign: string;

  house: number;
}

interface DetectConjunctionsInput {

  planets: PlanetPosition[];

  placements: PlanetHousePlacement[];

  maxOrb?: number;
}

export function detectConjunctions({

  planets,

  placements,

  maxOrb = 8

}: DetectConjunctionsInput): Conjunction[] {

  const conjunctions: Conjunction[] = [];

  for (
    let i = 0;
    i < planets.length;
    i++
  ) {

    for (
      let j = i + 1;
      j < planets.length;
      j++
    ) {

      const p1 =
        planets[i];

      const p2 =
        planets[j];

      /*
        Whole sign pre-filter
      */

      if (
        p1.sign !==
        p2.sign
      ) {
        continue;
      }

      const orb =
        Math.abs(
          p1.longitude -
          p2.longitude
        );

      if (
        orb > maxOrb
      ) {
        continue;
      }

      const placement =
        placements.find(
          (p) =>
            p.planet ===
            p1.planet
        );

      if (!placement) {
        continue;
      }

      conjunctions.push({

        planets: [
          p1.planet,
          p2.planet
        ],

        orb:
          Number(
            orb.toFixed(4)
          ),

        sign:
          p1.sign,

        house:
          placement.house
      });
    }
  }

  return conjunctions;
}