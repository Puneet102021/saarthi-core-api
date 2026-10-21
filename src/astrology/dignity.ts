import {
  EXALTATION,
  MOOLATRIKONA,
  NATURAL_ENEMIES,
  NATURAL_FRIENDS,
  Planet,
  SIGN_LORDS,
  SIGNS,
  Sign
} from "./constants";
import { houseFrom, indexOfSign } from "./math";
import type { Dignity } from "./types";

export function debilitationSign(planet: Planet): Sign | null {
  const exaltation = EXALTATION[planet];
  if (!exaltation) return null;
  return SIGNS[(indexOfSign(exaltation.sign) + 6) % 12];
}

export function ownSigns(planet: Planet): Sign[] {
  return SIGNS.filter((sign) => SIGN_LORDS[sign] === planet);
}

export type Relationship = "friend" | "neutral" | "enemy";

export function naturalRelationship(planet: Planet, other: Planet): Relationship {
  if (NATURAL_FRIENDS[planet]?.includes(other)) return "friend";
  if (NATURAL_ENEMIES[planet]?.includes(other)) return "enemy";
  return "neutral";
}

/*
  Temporal (tatkalika) friendship: a planet in the 2nd, 3rd, 4th, 10th, 11th
  or 12th sign from another is its temporal friend; otherwise an enemy.
*/
export function temporalRelationship(
  planetSignIndex: number,
  otherSignIndex: number
): "friend" | "enemy" {
  const distance = houseFrom(planetSignIndex, otherSignIndex);
  return [2, 3, 4, 10, 11, 12].includes(distance) ? "friend" : "enemy";
}

/* Five-fold (panchadha) relationship from natural + temporal. */
export function compoundRelationship(
  natural: Relationship,
  temporal: "friend" | "enemy"
): Dignity {
  if (natural === "friend") return temporal === "friend" ? "great_friend" : "neutral";
  if (natural === "enemy") return temporal === "friend" ? "neutral" : "great_enemy";
  return temporal === "friend" ? "friend" : "enemy";
}

/*
  Dignity of one of the seven planets at a sidereal position. `signIndexes`
  holds every planet's sign index in the same chart, for the temporal part of
  the friendship with the sign lord. Rahu and Ketu return null: their dignity
  is not settled in the classics, and the engine reads them through their
  dispositor instead.
*/
export function dignityOf(
  planet: Planet,
  sign: Sign,
  degree: number,
  signIndexes: Partial<Record<Planet, number>>
): Dignity | null {
  const exaltation = EXALTATION[planet];
  if (!exaltation) return null;

  const moolatrikona = MOOLATRIKONA[planet];

  const inMoolatrikona =
    moolatrikona &&
    moolatrikona.sign === sign &&
    degree >= moolatrikona.from &&
    degree < moolatrikona.to;

  /*
    Moon in Taurus and Mercury in Virgo share one sign between exaltation and
    moolatrikona: exalted before the moolatrikona range, moolatrikona within
    it, and (Mercury only) own sign after it.
  */
  const sharedSign = moolatrikona?.sign === exaltation.sign;

  if (exaltation.sign === sign) {
    if (!sharedSign || degree < (moolatrikona as { from: number }).from) return "exalted";
    if (inMoolatrikona) return "moolatrikona";
    return ownSigns(planet).includes(sign) ? "own" : "exalted";
  }

  if (debilitationSign(planet) === sign) return "debilitated";
  if (inMoolatrikona) return "moolatrikona";
  if (ownSigns(planet).includes(sign)) return "own";

  const lord = SIGN_LORDS[sign];
  const planetIndex = signIndexes[planet];
  const lordIndex = signIndexes[lord];

  const natural = naturalRelationship(planet, lord);

  if (planetIndex === undefined || lordIndex === undefined) {
    return natural;
  }

  return compoundRelationship(natural, temporalRelationship(planetIndex, lordIndex));
}

/* Sign-level dignity in a divisional chart: exalted, debilitated or own only. */
export function vargaDignity(planet: Planet, sign: Sign): Dignity | null {
  const exaltation = EXALTATION[planet];
  if (!exaltation) return null;
  if (exaltation.sign === sign) return "exalted";
  if (debilitationSign(planet) === sign) return "debilitated";
  if (ownSigns(planet).includes(sign)) return "own";
  return null;
}

export const DIGNITY_LABEL: Record<Dignity, string> = {
  exalted: "exalted",
  moolatrikona: "in moolatrikona",
  own: "in its own sign",
  great_friend: "in a great friend's sign",
  friend: "in a friend's sign",
  neutral: "in a neutral sign",
  enemy: "in an enemy's sign",
  great_enemy: "in a bitter enemy's sign",
  debilitated: "debilitated"
};
