import {
  PlanetPosition
} from "../calculators/calculatePlanetaryPositions";

export interface PlanetDignity {

  planet: string;

  dignity: string[];
}

const EXALTATION_SIGNS:
  Record<string, string> = {

  Sun: "Aries",

  Moon: "Taurus",

  Mars: "Capricorn",

  Mercury: "Virgo",

  Jupiter: "Cancer",

  Venus: "Pisces",

  Saturn: "Libra"
};

const DEBILITATION_SIGNS:
  Record<string, string> = {

  Sun: "Libra",

  Moon: "Scorpio",

  Mars: "Cancer",

  Mercury: "Pisces",

  Jupiter: "Capricorn",

  Venus: "Virgo",

  Saturn: "Aries"
};

const OWN_SIGNS:
  Record<string, string[]> = {

  Sun: ["Leo"],

  Moon: ["Cancer"],

  Mars: [
    "Aries",
    "Scorpio"
  ],

  Mercury: [
    "Gemini",
    "Virgo"
  ],

  Jupiter: [
    "Sagittarius",
    "Pisces"
  ],

  Venus: [
    "Taurus",
    "Libra"
  ],

  Saturn: [
    "Capricorn",
    "Aquarius"
  ]
};

const FRIEND_SIGNS:
  Record<string, string[]> = {

  Sun: [
    "Cancer",
    "Aries",
    "Sagittarius",
    "Pisces"
  ],

  Moon: [
    "Leo",
    "Gemini"
  ],

  Mars: [
    "Leo",
    "Cancer",
    "Sagittarius",
    "Pisces"
  ],

  Mercury: [
    "Taurus",
    "Leo",
    "Libra"
  ],

  Jupiter: [
    "Aries",
    "Leo",
    "Scorpio"
  ],

  Venus: [
    "Gemini",
    "Virgo",
    "Capricorn",
    "Aquarius"
  ],

  Saturn: [
    "Taurus",
    "Gemini",
    "Virgo",
    "Libra"
  ]
};

const ENEMY_SIGNS:
  Record<string, string[]> = {

  Sun: [
    "Taurus",
    "Libra",
    "Capricorn",
    "Aquarius"
  ],

  Moon: [],

  Mars: [
    "Gemini",
    "Virgo"
  ],

  Mercury: [
    "Cancer"
  ],

  Jupiter: [
    "Taurus",
    "Gemini",
    "Virgo",
    "Libra"
  ],

  Venus: [
    "Cancer",
    "Leo"
  ],

  Saturn: [
    "Cancer",
    "Leo",
    "Aries",
    "Scorpio"
  ]
};

export function buildPlanetDignities(

  planets: PlanetPosition[]

): PlanetDignity[] {

  return planets.map(
    (planet) => {

      const dignity =
        new Set<string>();

      /*
        Exaltation
      */

      if (
        EXALTATION_SIGNS[
          planet.planet
        ] ===
        planet.sign
      ) {

        dignity.add(
          "EXALTED"
        );
      }

      /*
        Debilitation
      */

      if (
        DEBILITATION_SIGNS[
          planet.planet
        ] ===
        planet.sign
      ) {

        dignity.add(
          "DEBILITATED"
        );
      }

      /*
        Own sign
      */

      if (
        OWN_SIGNS[
          planet.planet
        ]?.includes(
          planet.sign
        )
      ) {

        dignity.add(
          "OWN_SIGN"
        );
      }

      /*
        Friend sign
      */

      if (
        FRIEND_SIGNS[
          planet.planet
        ]?.includes(
          planet.sign
        )
      ) {

        dignity.add(
          "FRIEND_SIGN"
        );
      }

      /*
        Enemy sign
      */

      if (
        ENEMY_SIGNS[
          planet.planet
        ]?.includes(
          planet.sign
        )
      ) {

        dignity.add(
          "ENEMY_SIGN"
        );
      }

      /*
        Fallback
      */

      if (
        dignity.size === 0
      ) {

        dignity.add(
          "NEUTRAL_SIGN"
        );
      }

      return {

        planet:
          planet.planet,

        dignity:
          Array.from(
            dignity
          )
      };
    }
  );
}