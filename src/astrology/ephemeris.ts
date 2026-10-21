import sweph from "sweph";

import { Planet } from "./constants";
import { nakshatraOf, norm360, signIndexOf, signOf, degreeInSign } from "./math";
import type { PlanetPosition } from "./types";

const C = sweph.constants;

const AYANAMSAS: Record<string, number> = {
  lahiri: C.SE_SIDM_LAHIRI,
  raman: C.SE_SIDM_RAMAN,
  kp: C.SE_SIDM_KRISHNAMURTI
};

export interface EphemerisConfig {
  ayanamsa: keyof typeof AYANAMSAS;
  nodeType: "true" | "mean";
}

export function ephemerisConfig(): EphemerisConfig {
  const ayanamsa = (process.env.AYANAMSA || "lahiri").toLowerCase();
  const nodeType = (process.env.NODE_TYPE || "true").toLowerCase();

  return {
    ayanamsa: ayanamsa in AYANAMSAS ? ayanamsa : "lahiri",
    nodeType: nodeType === "mean" ? "mean" : "true"
  };
}

/*
  With SWEPH_EPHE_PATH pointing at the Swiss Ephemeris data files the full
  ephemeris is used; otherwise the built-in Moshier ephemeris, which is
  accurate to about an arcsecond for planets and a few for the Moon: far
  inside anything astrology depends on.
*/
const ephePath = process.env.SWEPH_EPHE_PATH;

if (ephePath) {
  sweph.set_ephe_path(ephePath);
}

const EPHE_FLAG = ephePath ? C.SEFLG_SWIEPH : C.SEFLG_MOSEPH;

function useSiderealMode(config: EphemerisConfig) {
  sweph.set_sid_mode(AYANAMSAS[config.ayanamsa], 0, 0);
}

export function julianDayUt(date: Date): number {
  const hours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    (date.getUTCSeconds() + date.getUTCMilliseconds() / 1000) / 3600;

  return sweph.julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    hours,
    C.SE_GREG_CAL
  );
}

export function ayanamsaAt(jdUt: number, config = ephemerisConfig()) {
  useSiderealMode(config);

  const result = sweph.get_ayanamsa_ex_ut(jdUt, EPHE_FLAG);

  return {
    name: sweph.get_ayanamsa_name(AYANAMSAS[config.ayanamsa]),
    value: result.data
  };
}

const BODIES: { planet: Planet; id: number }[] = [
  { planet: "Sun", id: C.SE_SUN },
  { planet: "Moon", id: C.SE_MOON },
  { planet: "Mars", id: C.SE_MARS },
  { planet: "Mercury", id: C.SE_MERCURY },
  { planet: "Jupiter", id: C.SE_JUPITER },
  { planet: "Venus", id: C.SE_VENUS },
  { planet: "Saturn", id: C.SE_SATURN }
];

function toPosition(
  planet: Planet,
  longitude: number,
  latitude: number,
  speed: number
): PlanetPosition {
  const lon = norm360(longitude);
  const nakshatra = nakshatraOf(lon);

  return {
    planet,
    longitude: lon,
    latitude,
    speed,
    sign: signOf(lon),
    signIndex: signIndexOf(lon),
    degree: degreeInSign(lon),
    nakshatra: nakshatra.name,
    nakshatraIndex: nakshatra.index,
    nakshatraLord: nakshatra.lord,
    pada: nakshatra.pada,
    /* The nodes always move backwards in the mean; Vedic practice calls them retrograde. */
    retrograde: planet === "Rahu" || planet === "Ketu" ? true : speed < 0
  };
}

function calcBody(jdUt: number, id: number) {
  const result = sweph.calc_ut(jdUt, id, EPHE_FLAG | C.SEFLG_SIDEREAL | C.SEFLG_SPEED);

  if (result.flag < 0) {
    throw new Error(`Ephemeris error: ${result.error}`);
  }

  return result.data;
}

/* Sidereal positions of the nine grahas at a UT Julian day. */
export function planetaryPositions(
  jdUt: number,
  config = ephemerisConfig()
): PlanetPosition[] {
  useSiderealMode(config);

  const positions = BODIES.map(({ planet, id }) => {
    const data = calcBody(jdUt, id);
    return toPosition(planet, data[0], data[1], data[3]);
  });

  const node = calcBody(
    jdUt,
    config.nodeType === "mean" ? C.SE_MEAN_NODE : C.SE_TRUE_NODE
  );

  positions.push(toPosition("Rahu", node[0], 0, node[3]));
  positions.push(toPosition("Ketu", node[0] + 180, 0, node[3]));

  return positions;
}

/*
  Sidereal ascendant. The house system argument only matters for cusps,
  which this engine does not use (houses are whole-sign from the ascendant).
*/
export function siderealAscendant(
  jdUt: number,
  latitude: number,
  longitude: number,
  config = ephemerisConfig()
): number {
  useSiderealMode(config);

  const result = sweph.houses_ex2(
    jdUt,
    C.SEFLG_SIDEREAL,
    latitude,
    longitude,
    "W"
  );

  if (result.flag < 0) {
    throw new Error(`House calculation error: ${result.error}`);
  }

  return norm360(result.data.points[0]);
}
