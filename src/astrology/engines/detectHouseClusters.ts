import {
  PlanetHousePlacement
} from "../builders/mapPlanetsToHouses";

export interface HouseCluster {

  house: number;

  planetCount: number;

  planets: string[];
}

export function detectHouseClusters(

  placements: PlanetHousePlacement[]

): HouseCluster[] {

  const clusterMap =
    new Map<
      number,
      string[]
    >();

  for (const placement of placements) {

    const existing =
      clusterMap.get(
        placement.house
      ) || [];

    existing.push(
      placement.planet
    );

    clusterMap.set(
      placement.house,
      existing
    );
  }

  const clusters: HouseCluster[] = [];

  for (
    const [
      house,
      planets
    ] of clusterMap.entries()
  ) {

    /*
      Ignore single occupancy
    */

    if (
      planets.length < 2
    ) {
      continue;
    }

    clusters.push({

      house,

      planetCount:
        planets.length,

      planets
    });
  }

  /*
    Highest density first
  */

  clusters.sort(
    (a, b) =>
      b.planetCount -
      a.planetCount
  );

  return clusters;
}