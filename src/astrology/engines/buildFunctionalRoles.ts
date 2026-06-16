import {
  HouseLord
} from "./buildHouseLords";

export interface FunctionalRole {

  planet: string;

  roles: string[];

  ownedHouses: number[];
}

const TRIKONA_HOUSES = [1, 5, 9];

const KENDRA_HOUSES = [1, 4, 7, 10];

const DUSTHANA_HOUSES = [6, 8, 12];

const MARAKA_HOUSES = [2, 7];

const UPAChAYA_HOUSES = [3, 6, 10, 11];

export function buildFunctionalRoles(
  houseLords: HouseLord[]
): FunctionalRole[] {

  const planetMap =
    new Map<string, number[]>();

  for (const houseLord of houseLords) {

    const existing =
      planetMap.get(
        houseLord.lord
      ) || [];

    existing.push(
      houseLord.house
    );

    planetMap.set(
      houseLord.lord,
      existing
    );
  }

  const roles:
    FunctionalRole[] = [];

  for (
    const [
      planet,
      ownedHouses
    ] of planetMap.entries()
  ) {

    const roleSet =
      new Set<string>();

    if (
      ownedHouses.some(
        house =>
          TRIKONA_HOUSES.includes(
            house
          )
      )
    ) {
      roleSet.add(
        "TRIKONA_LORD"
      );
    }

    if (
      ownedHouses.some(
        house =>
          KENDRA_HOUSES.includes(
            house
          )
      )
    ) {
      roleSet.add(
        "KENDRA_LORD"
      );
    }

    if (
      ownedHouses.some(
        house =>
          DUSTHANA_HOUSES.includes(
            house
          )
      )
    ) {
      roleSet.add(
        "DUSTHANA_LORD"
      );
    }

    if (
      ownedHouses.some(
        house =>
          MARAKA_HOUSES.includes(
            house
          )
      )
    ) {
      roleSet.add(
        "MARAKA_HOUSE_LORD"
      );
    }

    if (
      ownedHouses.some(
        house =>
          UPAChAYA_HOUSES.includes(
            house
          )
      )
    ) {
      roleSet.add(
        "UPACHAYA_LORD"
      );
    }

    roles.push({

      planet,

      ownedHouses:
        ownedHouses.sort(
          (a, b) => a - b
        ),

      roles:
        Array.from(
          roleSet
        )
    });
  }

  return roles;
}