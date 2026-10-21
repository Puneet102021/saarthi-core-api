import { EXALTATION, KENDRA, Planet, SEVEN_PLANETS, SIGN_LORDS, Sign } from "../constants";
import { debilitationSign } from "../dignity";
import { houseFrom } from "../math";
import type { YogaResult } from "../types";
import type { ChartCore } from "../chart";
import { planet, strengthFrom, weaken } from "./helpers";

interface Placed {
  planet: Planet;
  sign: Sign;
  signIndex: number;
  house: number;
  d9Sign: Sign;
  aspectsHouses: number[];
}

/*
  Cancellation of debilitation (neecha bhanga), from BPHS and Phaladeepika.
  Returns the conditions met for a debilitated planet; empty when the
  planet is not debilitated or nothing cancels it. Takes plain placements so
  it can run before planet strengths exist.
*/
export function neechaBhangaFor(
  name: Planet,
  placed: Placed[],
  moonSignIndex: number
): string[] {
  const p = placed.find((x) => x.planet === name);
  if (!p || debilitationSign(name) !== p.sign) return [];

  const find = (planetName: Planet) => placed.find((x) => x.planet === planetName) as Placed;

  const kendraFromLagnaOrMoon = (x: Placed) =>
    KENDRA.includes(x.house) || KENDRA.includes(houseFrom(moonSignIndex, x.signIndex));

  const met: string[] = [];

  const debilitationLord = find(SIGN_LORDS[p.sign]);
  if (debilitationLord.planet !== name && kendraFromLagnaOrMoon(debilitationLord)) {
    met.push(`${debilitationLord.planet}, lord of ${p.sign}, is in a kendra from the ascendant or Moon`);
  }

  const exaltationSign = EXALTATION[name]?.sign as Sign;
  const exaltationLord = find(SIGN_LORDS[exaltationSign]);
  if (exaltationLord.planet !== name && kendraFromLagnaOrMoon(exaltationLord)) {
    met.push(`${exaltationLord.planet}, lord of its exaltation sign ${exaltationSign}, is in a kendra from the ascendant or Moon`);
  }

  const exaltsHere = SEVEN_PLANETS.find((x) => EXALTATION[x]?.sign === p.sign);
  if (exaltsHere) {
    const other = find(exaltsHere);
    if (kendraFromLagnaOrMoon(other)) {
      met.push(`${exaltsHere}, which is exalted in ${p.sign}, is in a kendra from the ascendant or Moon`);
    }
  }

  if (debilitationLord.planet !== name && debilitationLord.aspectsHouses.includes(p.house)) {
    met.push(`${debilitationLord.planet}, lord of ${p.sign}, aspects it`);
  }

  if (EXALTATION[name]?.sign === p.d9Sign) {
    met.push("it is exalted in the navamsa (D9)");
  }

  return met;
}

export function neechaBhangaRajaYoga(core: ChartCore): YogaResult[] {
  const moonIndex = planet(core, "Moon").signIndex;

  return core.planets
    .filter((p) => p.dignity === "debilitated")
    .flatMap((p) => {
      const met = neechaBhangaFor(p.planet, core.planets, moonIndex);
      if (met.length === 0) return [];

      const base = strengthFrom([p]);

      return [
        {
          id: `NEECHA_BHANGA_${p.planet.toUpperCase()}`,
          name: `Neecha Bhanga Raja Yoga (${p.planet})`,
          kind: "yoga" as const,
          strength: met.length >= 3 ? base : weaken(base, met.length >= 2 ? 0 : 1),
          planets: [p.planet],
          houses: [p.house, ...p.ownsHouses],
          domains: ["general", "career"],
          factors: [`${p.planet} is debilitated in ${p.sign} (house ${p.house})`, ...met],
          cancellations: [],
          dependsOnAscendant: met.some((m) => m.includes("ascendant"))
        }
      ];
    });
}
