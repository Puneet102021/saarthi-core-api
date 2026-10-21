import { Sign } from "../constants";
import { houseFrom, norm360 } from "../math";
import type { YogaStrength } from "../types";
import { ordinal, planet, weaken, YogaRule } from "./helpers";

const MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12];

/* Widely used exceptions: Mars in these signs in these houses (from the ascendant) gives no dosha. */
const MANGLIK_SIGN_EXCEPTIONS: Record<number, Sign[]> = {
  1: ["Aries", "Leo"],
  2: ["Gemini", "Virgo"],
  4: ["Aries", "Scorpio"],
  7: ["Capricorn", "Cancer"],
  8: ["Sagittarius", "Pisces"],
  12: ["Taurus", "Libra"]
};

/*
  Manglik (Kuja) dosha: Mars in the 1st, 2nd, 4th, 7th, 8th or 12th, checked
  from the ascendant, the Moon and Venus. Each reference that holds adds
  weight; recognised exceptions weaken it. It is meant for marriage matching,
  where the same dosha in both charts cancels.
*/
export const manglik: YogaRule = (core) => {
  const mars = planet(core, "Mars");
  const moon = planet(core, "Moon");
  const venus = planet(core, "Venus");

  const references: string[] = [];

  if (core.birthTimeKnown && MANGLIK_HOUSES.includes(mars.house)) {
    references.push(`Mars in the ${ordinal(mars.house)} from the ascendant`);
  }

  const fromMoon = houseFrom(moon.signIndex, mars.signIndex);
  if (MANGLIK_HOUSES.includes(fromMoon)) references.push(`Mars in the ${ordinal(fromMoon)} from the Moon`);

  const fromVenus = houseFrom(venus.signIndex, mars.signIndex);
  if (MANGLIK_HOUSES.includes(fromVenus)) references.push(`Mars in the ${ordinal(fromVenus)} from Venus`);

  if (references.length === 0) return [];

  const cancellations: string[] = [];

  if (mars.dignity === "own" || mars.dignity === "moolatrikona" || mars.dignity === "exalted") {
    cancellations.push(`Mars is strong in ${mars.sign}`);
  }

  if (core.birthTimeKnown && MANGLIK_SIGN_EXCEPTIONS[mars.house]?.includes(mars.sign)) {
    cancellations.push(`Mars in ${mars.sign} in the ${ordinal(mars.house)} is a recognised exception`);
  }

  const jupiter = planet(core, "Jupiter");
  if (jupiter.signIndex === mars.signIndex || jupiter.aspectsHouses.includes(mars.house)) {
    cancellations.push("Jupiter joins or aspects Mars");
  }

  const base: YogaStrength =
    references.length >= 3 ? "strong" : references.length === 2 ? "moderate" : "weak";

  return [
    {
      id: "MANGLIK",
      name: "Manglik (Kuja) Dosha",
      kind: "dosha",
      strength: weaken(base, cancellations.length),
      planets: ["Mars"],
      houses: [mars.house, 7],
      domains: ["marriage"],
      factors: references,
      cancellations,
      dependsOnAscendant: references.some((r) => r.includes("ascendant"))
    }
  ];
};

const KAAL_SARP_NAMES: Record<number, string> = {
  1: "Anant",
  2: "Kulik",
  3: "Vasuki",
  4: "Shankhpal",
  5: "Padma",
  6: "Mahapadma",
  7: "Takshak",
  8: "Karkotak",
  9: "Shankhachud",
  10: "Ghatak",
  11: "Vishdhar",
  12: "Sheshnag"
};

/*
  Kaal Sarp: all seven planets on one side of the Rahu-Ketu axis, in either
  direction. Not described in BPHS; included because users ask about it.
*/
export const kaalSarp: YogaRule = (core) => {
  const rahu = planet(core, "Rahu");
  const seven = core.planets.filter((p) => p.planet !== "Rahu" && p.planet !== "Ketu");

  const offsets = seven.map((p) => norm360(p.longitude - rahu.longitude));

  const rahuToKetu = offsets.every((o) => o > 0 && o < 180);
  const ketuToRahu = offsets.every((o) => o > 180 && o < 360);

  if (!rahuToKetu && !ketuToRahu) return [];

  const type = core.birthTimeKnown ? KAAL_SARP_NAMES[rahu.house] : null;

  return [
    {
      id: "KAAL_SARP",
      name: `Kaal Sarp Dosha${type ? ` (${type})` : ""}`,
      kind: "dosha",
      strength: "moderate",
      planets: ["Rahu", "Ketu"],
      houses: [rahu.house, ((rahu.house + 5) % 12) + 1],
      domains: ["general"],
      factors: [
        `all seven planets lie ${rahuToKetu ? "from Rahu to Ketu" : "from Ketu to Rahu"}`,
        `Rahu in ${rahu.sign}`
      ],
      cancellations: [],
      modern: true,
      dependsOnAscendant: false
    }
  ];
};

export const guruChandal: YogaRule = (core) => {
  const jupiter = planet(core, "Jupiter");
  const rahu = planet(core, "Rahu");

  if (jupiter.signIndex !== rahu.signIndex) return [];

  const cancellations: string[] = [];
  if (jupiter.dignity === "own" || jupiter.dignity === "exalted" || jupiter.dignity === "moolatrikona") {
    cancellations.push(`Jupiter is strong in ${jupiter.sign}`);
  }

  return [
    {
      id: "GURU_CHANDAL",
      name: "Guru Chandal Dosha",
      kind: "dosha",
      strength: weaken("moderate", cancellations.length),
      planets: ["Jupiter", "Rahu"],
      houses: [jupiter.house],
      domains: ["education", "spirituality", "children"],
      factors: [`Jupiter with Rahu in ${jupiter.sign}`],
      cancellations,
      modern: true,
      dependsOnAscendant: false
    }
  ];
};

export const shrapit: YogaRule = (core) => {
  const saturn = planet(core, "Saturn");
  const rahu = planet(core, "Rahu");

  if (saturn.signIndex !== rahu.signIndex) return [];

  return [
    {
      id: "SHRAPIT",
      name: "Shrapit Dosha",
      kind: "dosha",
      strength: "moderate",
      planets: ["Saturn", "Rahu"],
      houses: [saturn.house],
      domains: ["general", "career"],
      factors: [`Saturn with Rahu in ${saturn.sign}`],
      cancellations: [],
      modern: true,
      dependsOnAscendant: false
    }
  ];
};

export const pitra: YogaRule = (core) => {
  const sun = planet(core, "Sun");
  const rahu = planet(core, "Rahu");
  const ketu = planet(core, "Ketu");

  const indicators: string[] = [];
  let ascendantBased = false;

  if (sun.signIndex === rahu.signIndex) indicators.push(`Sun with Rahu in ${sun.sign}`);
  if (sun.signIndex === ketu.signIndex) indicators.push(`Sun with Ketu in ${sun.sign}`);

  if (core.birthTimeKnown) {
    const ninthLord = planet(core, core.houses[8].lord);

    if (rahu.house === 9) indicators.push("Rahu in the 9th house");
    if (ketu.house === 9) indicators.push("Ketu in the 9th house");
    if (ninthLord.signIndex === rahu.signIndex || ninthLord.signIndex === ketu.signIndex) {
      indicators.push(`9th lord ${ninthLord.planet} with a node`);
    }
    ascendantBased = indicators.some((i) => i.includes("9th"));
  }

  if (indicators.length === 0) return [];

  return [
    {
      id: "PITRA",
      name: "Pitra Dosha",
      kind: "dosha",
      strength: indicators.length >= 2 ? "moderate" : "weak",
      planets: ["Sun", "Rahu", "Ketu"],
      houses: [9, sun.house],
      domains: ["father", "general"],
      factors: indicators,
      cancellations: [],
      modern: true,
      dependsOnAscendant: ascendantBased
    }
  ];
};

export const chandraGrahan: YogaRule = (core) => {
  const moon = planet(core, "Moon");
  const rahu = planet(core, "Rahu");
  const ketu = planet(core, "Ketu");

  const node =
    moon.signIndex === rahu.signIndex ? rahu : moon.signIndex === ketu.signIndex ? ketu : null;

  if (!node) return [];

  return [
    {
      id: "CHANDRA_GRAHAN",
      name: "Chandra Grahan Dosha",
      kind: "dosha",
      strength: "moderate",
      planets: ["Moon", node.planet],
      houses: [moon.house],
      domains: ["mind", "mother"],
      factors: [`Moon with ${node.planet} in ${moon.sign}`],
      cancellations: [],
      modern: true,
      dependsOnAscendant: false
    }
  ];
};

export function doshaRules(): YogaRule[] {
  return [manglik, kaalSarp, guruChandal, shrapit, pitra, chandraGrahan];
}
