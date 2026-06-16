import sweph from "sweph";

import {
  getZodiacSign,
  getDegreeInSign
} from "../utils/zodiac";

import {
  getNakshatra
} from "../utils/nakshatra";

const C =
  sweph.constants;

export interface PlanetPosition {

  planet: string;

  longitude: number;

  latitude: number;

  speed: number;

  sign: string;

  degreeInSign: number;

  nakshatra: string;

  nakshatraPada: number;

  isRetrograde: boolean;
}

export interface PlanetaryPositionsResult {

  julianDay: number;

  planets: PlanetPosition[];
}

const PLANETS = [

  {
    key: "Sun",
    id: C.SE_SUN
  },

  {
    key: "Moon",
    id: C.SE_MOON
  },

  {
    key: "Mercury",
    id: C.SE_MERCURY
  },

  {
    key: "Venus",
    id: C.SE_VENUS
  },

  {
    key: "Mars",
    id: C.SE_MARS
  },

  {
    key: "Jupiter",
    id: C.SE_JUPITER
  },

  {
    key: "Saturn",
    id: C.SE_SATURN
  },

  {
    key: "Rahu",
    id: C.SE_TRUE_NODE
  }
];

function normalizeDegrees(
  value: number
): number {

  let result =
    value % 360;

  if (result < 0) {
    result += 360;
  }

  return result;
}

function calculateKetuLongitude(
  rahuLongitude: number
): number {

  return normalizeDegrees(
    rahuLongitude + 180
  );
}

function buildPlanetObject(
  planet: string,
  longitude: number,
  latitude: number,
  speed: number
): PlanetPosition {

  const normalizedLongitude =
    normalizeDegrees(longitude);

  const sign =
    getZodiacSign(
      normalizedLongitude
    );

  const degreeInSign =
    getDegreeInSign(
      normalizedLongitude
    );

  const nakshatra =
    getNakshatra(
      normalizedLongitude
    );

  return {

    planet,

    longitude:
      normalizedLongitude,

    latitude,

    speed,

    sign,

    degreeInSign,

    nakshatra:
      nakshatra.name,

    nakshatraPada:
      nakshatra.pada,

    isRetrograde:
      speed < 0
  };
}

export async function calculatePlanetaryPositions(

  year: number,
  month: number,
  day: number,
  hour: number

): Promise<PlanetaryPositionsResult> {

  sweph.set_sid_mode(
    C.SE_SIDM_LAHIRI,
    0,
    0
  );

  const julianDay =
    sweph.julday(
      year,
      month,
      day,
      hour,
      C.SE_GREG_CAL
    );

  const planets: PlanetPosition[] = [];

  for (const planet of PLANETS) {

    const result =
      sweph.calc_ut(
        julianDay,
        planet.id,
        C.SEFLG_SIDEREAL |
        C.SEFLG_SPEED
      );

    const data =
      result.data;

    const longitude =
      data[0];

    const latitude =
      data[1];

    const speed =
      data[3];

    planets.push(

      buildPlanetObject(
        planet.key,
        longitude,
        latitude,
        speed
      )
    );

    /*
      KETU
    */

    if (
      planet.key === "Rahu"
    ) {

      const ketuLongitude =
        calculateKetuLongitude(
          longitude
        );

      planets.push(

        buildPlanetObject(
          "Ketu",
          ketuLongitude,
          0,
          -speed
        )
      );
    }
  }

  return {

    julianDay,

    planets
  };
}