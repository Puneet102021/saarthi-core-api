import {
  PlanetPosition
} from "../calculators/calculatePlanetaryPositions";

import {
  PlanetHousePlacement
} from "../builders/mapPlanetsToHouses";

import {
  PlanetaryAspect
} from "./detectPlanetaryAspects";

export interface PlanetaryConditionTags {

  planet: string;

  tags: string[];
}

const FIRE_SIGNS = [
  "Aries",
  "Leo",
  "Sagittarius"
];

const EARTH_SIGNS = [
  "Taurus",
  "Virgo",
  "Capricorn"
];

const AIR_SIGNS = [
  "Gemini",
  "Libra",
  "Aquarius"
];

const WATER_SIGNS = [
  "Cancer",
  "Scorpio",
  "Pisces"
];

const BENEFICS = [
  "Jupiter",
  "Venus",
  "Moon"
];

const MALEFICS = [
  "Saturn",
  "Mars",
  "Rahu",
  "Ketu"
];

export function buildPlanetaryConditionTags(

  planets: PlanetPosition[],

  placements: PlanetHousePlacement[],

  aspects: PlanetaryAspect[]

): PlanetaryConditionTags[] {

  return planets.map(
    (planet) => {

      const tags =
        new Set<string>();

      /*
        SIGN ELEMENT
      */

      if (
        FIRE_SIGNS.includes(
          planet.sign
        )
      ) {
        tags.add(
          "FIRE_SIGN"
        );
      }

      if (
        EARTH_SIGNS.includes(
          planet.sign
        )
      ) {
        tags.add(
          "EARTH_SIGN"
        );
      }

      if (
        AIR_SIGNS.includes(
          planet.sign
        )
      ) {
        tags.add(
          "AIR_SIGN"
        );
      }

      if (
        WATER_SIGNS.includes(
          planet.sign
        )
      ) {
        tags.add(
          "WATER_SIGN"
        );
      }

      /*
        BENEFIC / MALEFIC
      */

      if (
        BENEFICS.includes(
          planet.planet
        )
      ) {
        tags.add(
          "BENEFIC"
        );
      }

      if (
        MALEFICS.includes(
          planet.planet
        )
      ) {
        tags.add(
          "MALEFIC"
        );
      }

      /*
        RETROGRADE
      */

      if (
        planet.isRetrograde
      ) {
        tags.add(
          "RETROGRADE"
        );
      } else {
        tags.add(
          "DIRECT"
        );
      }

      /*
        HOUSE
      */

      const placement =
        placements.find(
          (p) =>
            p.planet ===
            planet.planet
        );

      if (placement) {

        tags.add(
          `HOUSE_${placement.house}`
        );
      }

      /*
        ASPECT TAGS
      */

      const relatedAspects =
        aspects.filter(
          (aspect) =>

            aspect.planet1 ===
              planet.planet ||

            aspect.planet2 ===
              planet.planet
        );

      for (
        const aspect
        of relatedAspects
      ) {

        tags.add(
          `${aspect.aspect.toUpperCase()}_ASPECT`
        );

        const otherPlanet =
          aspect.planet1 ===
          planet.planet

            ? aspect.planet2
            : aspect.planet1;

        tags.add(
          `${aspect.aspect.toUpperCase()}_${otherPlanet.toUpperCase()}`
        );
      }

      return {

        planet:
          planet.planet,

        tags:
          Array.from(tags)
      };
    }
  );
}