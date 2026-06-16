import {
  PlanetHousePlacement
} from "../builders/mapPlanetsToHouses";

export interface VedicDrishti {

  planet: string;

  fromHouse: number;

  aspects: {

    targetHouse: number;

    aspectType: string;
  }[];
}

const SPECIAL_ASPECTS:
  Record<string, number[]> = {

  Mars: [4, 7, 8],

  Jupiter: [5, 7, 9],

  Saturn: [3, 7, 10]
};

function normalizeHouse(
  house: number
): number {

  return ((house - 1) % 12) + 1;
}

export function buildVedicDrishti(
  placements: PlanetHousePlacement[]
): VedicDrishti[] {

  return placements.map(
    (placement) => {

      const aspectOffsets =
        SPECIAL_ASPECTS[
          placement.planet
        ] || [7];

      const aspects =
        aspectOffsets.map(
          (offset) => {

            const targetHouse =
              normalizeHouse(
                placement.house + offset - 1
              );

            return {

              targetHouse,

              aspectType:
                `${offset}TH_ASPECT`
            };
          }
        );

      return {

        planet:
          placement.planet,

        fromHouse:
          placement.house,

        aspects
      };
    }
  );
}