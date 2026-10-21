import { DUSTHANA, KENDRA, Planet, SIGN_LORDS } from "../constants";
import { houseFrom } from "../math";
import type { PlanetInfo, YogaResult } from "../types";
import { describe, inKendraFrom, lordOf, ordinal, planet, relationBetween, strengthFrom, weaken, YogaRule } from "./helpers";

export const gajakesari: YogaRule = (core) => {
  const moon = planet(core, "Moon");
  const jupiter = planet(core, "Jupiter");

  if (!inKendraFrom(moon.signIndex, jupiter)) return [];

  const distance = houseFrom(moon.signIndex, jupiter.signIndex);
  const cancellations: string[] = [];
  let strength = strengthFrom([moon, jupiter]);

  if (jupiter.dignity === "debilitated") cancellations.push("Jupiter is debilitated");
  if (jupiter.combust) cancellations.push("Jupiter is combust");
  if (core.moonPaksha === "krishna" && moon.naturalNature === "malefic") {
    cancellations.push("the Moon is dim (waning, near the Sun)");
  }

  strength = weaken(strength, cancellations.length);

  return [
    {
      id: "GAJAKESARI",
      name: "Gajakesari Yoga",
      kind: "yoga",
      strength,
      planets: ["Moon", "Jupiter"],
      houses: [moon.house, jupiter.house],
      domains: ["general", "wealth", "education", "career"],
      factors: [
        describe(moon),
        describe(jupiter),
        distance === 1
          ? "Jupiter is with the Moon"
          : `Jupiter is in the ${distance}th from the Moon (a kendra)`
      ],
      cancellations,
      dependsOnAscendant: false
    }
  ];
};

export const budhaditya: YogaRule = (core) => {
  const sun = planet(core, "Sun");
  const mercury = planet(core, "Mercury");

  if (sun.signIndex !== mercury.signIndex) return [];

  const cancellations: string[] = [];
  if (mercury.combust) {
    cancellations.push(
      `Mercury is combust (${mercury.distanceFromSun.toFixed(1)}° from the Sun); most texts treat the yoga as weak then`
    );
  }

  return [
    {
      id: "BUDHADITYA",
      name: "Budhaditya Yoga",
      kind: "yoga",
      strength: weaken(strengthFrom([sun, mercury]), cancellations.length),
      planets: ["Sun", "Mercury"],
      houses: [sun.house],
      domains: ["education", "career"],
      factors: [`Sun and Mercury together in ${sun.sign}, house ${sun.house}`],
      cancellations,
      dependsOnAscendant: false
    }
  ];
};

export const chandraMangala: YogaRule = (core) => {
  const moon = planet(core, "Moon");
  const mars = planet(core, "Mars");
  const distance = houseFrom(moon.signIndex, mars.signIndex);

  if (distance !== 1 && distance !== 7) return [];

  return [
    {
      id: "CHANDRA_MANGALA",
      name: "Chandra-Mangala Yoga",
      kind: "yoga",
      strength: strengthFrom([moon, mars]),
      planets: ["Moon", "Mars"],
      houses: [moon.house, mars.house],
      domains: ["wealth"],
      factors: [
        distance === 1
          ? `Moon and Mars together in ${moon.sign}`
          : "Moon and Mars opposite each other (mutual 7th)"
      ],
      cancellations: [],
      dependsOnAscendant: false
    }
  ];
};

const MAHAPURUSHA: { planet: Planet; id: string; name: string; domains: string[] }[] = [
  { planet: "Mars", id: "RUCHAKA", name: "Ruchaka Yoga", domains: ["career", "self", "disputes"] },
  { planet: "Mercury", id: "BHADRA", name: "Bhadra Yoga", domains: ["education", "career"] },
  { planet: "Jupiter", id: "HAMSA", name: "Hamsa Yoga", domains: ["spirituality", "education", "wealth"] },
  { planet: "Venus", id: "MALAVYA", name: "Malavya Yoga", domains: ["marriage", "love", "wealth", "home"] },
  { planet: "Saturn", id: "SASA", name: "Sasa Yoga", domains: ["career"] }
];

/* Pancha Mahapurusha: Mars to Saturn in own or exaltation sign in a kendra. */
export const panchaMahapurusha: YogaRule = (core) =>
  MAHAPURUSHA.flatMap((def) => {
    const p = planet(core, def.planet);

    const dignified =
      p.dignity === "exalted" || p.dignity === "own" || p.dignity === "moolatrikona";

    if (!dignified || !KENDRA.includes(p.house)) return [];

    const cancellations = p.combust ? [`${p.planet} is combust`] : [];

    return [
      {
        id: def.id,
        name: `${def.name} (Pancha Mahapurusha)`,
        kind: "yoga" as const,
        strength: weaken(strengthFrom([p]), cancellations.length),
        planets: [p.planet],
        houses: [p.house],
        domains: ["general", ...def.domains],
        factors: [`${p.planet} is ${p.dignity === "own" ? "in its own sign" : p.dignity} in ${p.sign}, in kendra house ${p.house}`],
        cancellations,
        dependsOnAscendant: true
      }
    ];
  });

/* Rulers of dusthanas taint a yoga they join, unless the dusthana is also the ascendant. */
function dusthanaTaint(p: PlanetInfo): number[] {
  return p.ownsHouses.filter((h) => DUSTHANA.includes(h) && !p.ownsHouses.includes(1));
}

/*
  Raja yoga: a kendra lord (1, 4, 7, 10) joined to a trikona lord (5, 9) by
  conjunction, mutual aspect or sign exchange; or one planet ruling both
  (a yogakaraka). The 9th-10th case is Dharma-Karmadhipati yoga.
*/
export const rajaYogas: YogaRule = (core) => {
  const results: YogaResult[] = [];
  const seen = new Set<string>();
  const dharmaKarmaKey = [lordOf(core, 9).planet, lordOf(core, 10).planet].sort().join("_");

  for (const k of [1, 4, 7, 10]) {
    for (const t of [5, 9]) {
      const a = lordOf(core, k);
      const b = lordOf(core, t);

      if (a.planet === b.planet) {
        const key = `YK_${a.planet}`;
        if (seen.has(key) || k === 1) continue;
        seen.add(key);

        results.push({
          id: `YOGAKARAKA_${a.planet.toUpperCase()}`,
          name: `Yogakaraka ${a.planet}`,
          kind: "yoga",
          strength: strengthFrom([a]),
          planets: [a.planet],
          houses: [k, t, a.house],
          domains: ["career", "general", "wealth"],
          factors: [
            `${a.planet} rules both the ${ordinal(k)} (kendra) and the ${ordinal(t)} (trikona)`,
            describe(a)
          ],
          cancellations: [],
          dependsOnAscendant: true
        });
        continue;
      }

      const relation = relationBetween(a, b);
      if (!relation) continue;

      const key = [a.planet, b.planet].sort().join("_");
      if (seen.has(key)) continue;
      seen.add(key);

      const tainted = [...dusthanaTaint(a), ...dusthanaTaint(b)];
      const isDharmaKarma = key === dharmaKarmaKey;

      results.push({
        id: isDharmaKarma ? "DHARMA_KARMADHIPATI" : `RAJA_${key.toUpperCase()}`,
        name: isDharmaKarma ? "Dharma-Karmadhipati Yoga" : "Raja Yoga",
        kind: "yoga",
        strength: weaken(strengthFrom([a, b]), tainted.length ? 1 : 0),
        planets: [a.planet, b.planet],
        houses: [k, t, a.house, b.house],
        domains: ["career", "general", "wealth"],
        factors: [
          `${a.planet} (lord of the ${ordinal(k)}) and ${b.planet} (lord of the ${ordinal(t)}) are joined by ${relation}`,
          describe(a),
          describe(b)
        ],
        cancellations: tainted.length
          ? [`weakened: a participant also rules dusthana house ${[...new Set(tainted)].join(", ")}`]
          : [],
        dependsOnAscendant: true
      });
    }
  }

  return results;
};

/* Dhana yoga: lords of the wealth houses (2, 11) joined to lords of 1, 5 or 9. */
export const dhanaYogas: YogaRule = (core) => {
  const results: YogaResult[] = [];
  const seen = new Set<string>();

  for (const w of [2, 11]) {
    for (const t of [1, 5, 9]) {
      const a = lordOf(core, w);
      const b = lordOf(core, t);
      const relation = relationBetween(a, b);
      if (!relation) continue;

      const key = [a.planet, b.planet].sort().join("_");
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        id: `DHANA_${key.toUpperCase()}`,
        name: "Dhana Yoga",
        kind: "yoga",
        strength: strengthFrom([a, b]),
        planets: [a.planet, b.planet],
        houses: [w, t, a.house, b.house],
        domains: ["wealth"],
        factors: [
          `${a.planet} (lord of the ${ordinal(w)}) and ${b.planet} (lord of the ${ordinal(t)}) are joined by ${relation}`,
          describe(a),
          describe(b)
        ],
        cancellations: [],
        dependsOnAscendant: true
      });
    }
  }

  return results;
};

const VIPARITA: Record<number, { id: string; name: string; domains: string[] }> = {
  6: { id: "HARSHA", name: "Harsha Yoga", domains: ["health", "disputes", "career"] },
  8: { id: "SARALA", name: "Sarala Yoga", domains: ["general", "career"] },
  12: { id: "VIMALA", name: "Vimala Yoga", domains: ["wealth", "spirituality", "travel"] }
};

/* Viparita Raja yoga: the lord of a dusthana placed in a dusthana. */
export const viparitaRajaYogas: YogaRule = (core) =>
  [6, 8, 12].flatMap((house) => {
    const lord = lordOf(core, house);

    if (!DUSTHANA.includes(lord.house)) return [];
    /* An ascendant lord in a dusthana is an affliction, not a reversal. */
    if (lord.ownsHouses.includes(1)) return [];

    const def = VIPARITA[house];

    return [
      {
        id: def.id,
        name: `${def.name} (Viparita Raja Yoga)`,
        kind: "yoga" as const,
        strength: lord.combust ? "weak" : "moderate",
        planets: [lord.planet],
        houses: [house, lord.house],
        domains: def.domains,
        factors: [`${lord.planet}, lord of the ${ordinal(house)}, sits in the ${ordinal(lord.house)}`],
        cancellations: lord.combust ? [`${lord.planet} is combust`] : [],
        dependsOnAscendant: true
      }
    ];
  });

/* Parivartana: two planets each in the other's sign. */
export const parivartanaYogas: YogaRule = (core) => {
  const results: YogaResult[] = [];
  const seven = core.planets.filter((p) => p.planet !== "Rahu" && p.planet !== "Ketu");

  for (let i = 0; i < seven.length; i++) {
    for (let j = i + 1; j < seven.length; j++) {
      const a = seven[i];
      const b = seven[j];
      if (SIGN_LORDS[a.sign] !== b.planet || SIGN_LORDS[b.sign] !== a.planet) continue;

      const houses = [a.house, b.house];
      const type = houses.some((h) => DUSTHANA.includes(h))
        ? { id: "DAINYA", name: "Dainya Parivartana", note: "involves a dusthana; mixed results" }
        : houses.includes(3)
          ? { id: "KHALA", name: "Khala Parivartana", note: "involves the 3rd; results through effort" }
          : { id: "MAHA", name: "Maha Parivartana", note: "between good houses; strongly favourable" };

      results.push({
        id: `PARIVARTANA_${a.planet.toUpperCase()}_${b.planet.toUpperCase()}`,
        name: `${type.name} Yoga`,
        kind: "yoga",
        strength: type.id === "MAHA" ? strengthFrom([a, b]) : weaken(strengthFrom([a, b])),
        planets: [a.planet, b.planet],
        houses,
        domains: ["general"],
        factors: [
          `${a.planet} in ${a.sign} (house ${a.house}) and ${b.planet} in ${b.sign} (house ${b.house}) exchange signs`,
          type.note
        ],
        cancellations: [],
        dependsOnAscendant: true
      });
    }
  }

  return results;
};

/*
  Kemadruma: no planet other than the Sun and the nodes in the 2nd or 12th
  from the Moon, and none with it. Cancelled by a planet in a kendra from the
  ascendant or the Moon, or by Jupiter's aspect on the Moon.
*/
export const kemadruma: YogaRule = (core) => {
  const moon = planet(core, "Moon");
  const others = core.planets.filter((p) => !["Sun", "Moon", "Rahu", "Ketu"].includes(p.planet));

  const flanked = others.some((p) => [1, 2, 12].includes(houseFrom(moon.signIndex, p.signIndex)));
  if (flanked) return [];

  const cancellations: string[] = [];

  const inKendraFromMoon = others.filter((p) => inKendraFrom(moon.signIndex, p));
  if (inKendraFromMoon.length) {
    cancellations.push(`${inKendraFromMoon.map((p) => p.planet).join(", ")} in a kendra from the Moon`);
  }

  const inKendraFromLagna = others.filter((p) => KENDRA.includes(p.house));
  if (inKendraFromLagna.length && core.birthTimeKnown) {
    cancellations.push(`${inKendraFromLagna.map((p) => p.planet).join(", ")} in a kendra from the ascendant`);
  }

  const jupiter = planet(core, "Jupiter");
  if (jupiter.aspectsHouses.includes(moon.house)) cancellations.push("Jupiter aspects the Moon");

  return [
    {
      id: "KEMADRUMA",
      name: "Kemadruma Yoga",
      kind: "dosha",
      strength: cancellations.length ? "cancelled" : "moderate",
      planets: ["Moon"],
      houses: [moon.house],
      domains: ["mind", "wealth"],
      factors: [`no planet in the 2nd or 12th from the Moon (${moon.sign}), and none with it`],
      cancellations,
      dependsOnAscendant: false
    }
  ];
};

export function asYogaRules(): YogaRule[] {
  return [
    gajakesari,
    budhaditya,
    chandraMangala,
    panchaMahapurusha,
    rajaYogas,
    dhanaYogas,
    viparitaRajaYogas,
    parivartanaYogas,
    kemadruma
  ];
}
