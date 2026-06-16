import {
  PlanetPosition
} from "../calculators/calculatePlanetaryPositions";

export interface SignCluster {

  sign: string;

  planetCount: number;

  planets: string[];
}

export function detectSignClusters(

  planets: PlanetPosition[]

): SignCluster[] {

  const clusterMap =
    new Map<
      string,
      string[]
    >();

  for (const planet of planets) {

    const existing =
      clusterMap.get(
        planet.sign
      ) || [];

    existing.push(
      planet.planet
    );

    clusterMap.set(
      planet.sign,
      existing
    );
  }

  const clusters: SignCluster[] = [];

  for (
    const [
      sign,
      planetList
    ] of clusterMap.entries()
  ) {

    /*
      Ignore isolated planets
    */

    if (
      planetList.length < 2
    ) {
      continue;
    }

    clusters.push({

      sign,

      planetCount:
        planetList.length,

      planets:
        planetList
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