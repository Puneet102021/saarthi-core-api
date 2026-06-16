import {
  PlanetPosition
} from "../calculators/calculatePlanetaryPositions";

import {
  House
} from "./buildHouses";

export interface PlanetHousePlacement
  extends PlanetPosition {

  house: number;
}

export function mapPlanetsToHouses(

  planets: PlanetPosition[],

  houses: House[]

): PlanetHousePlacement[] {

  return planets.map(
    (planet) => {

      const matchingHouse =
        houses.find(
          (house) =>
            house.sign ===
            planet.sign
        );

      if (!matchingHouse) {

        throw new Error(
          `No house found for sign ${planet.sign}`
        );
      }

      return {

        ...planet,

        house:
          matchingHouse.house
      };
    }
  );
}