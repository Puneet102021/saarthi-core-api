import { KENDRA, Planet, SIGN_LORDS } from "../constants";
import { mutuallyAspect } from "../aspects";
import { houseFrom } from "../math";
import { strengthLabel } from "../strength";
import type { PlanetInfo, YogaResult, YogaStrength } from "../types";
import type { ChartCore } from "../chart";

export function planet(core: ChartCore, name: Planet): PlanetInfo {
  return core.planets.find((p) => p.planet === name) as PlanetInfo;
}

export function lordOf(core: ChartCore, house: number): PlanetInfo {
  return planet(core, core.houses[house - 1].lord);
}

export function inKendraFrom(fromSignIndex: number, p: { signIndex: number }): boolean {
  return KENDRA.includes(houseFrom(fromSignIndex, p.signIndex));
}

export type Relation = "conjunction" | "mutual aspect" | "sign exchange";

/* The three classical associations that join two planets into a yoga. */
export function relationBetween(a: PlanetInfo, b: PlanetInfo): Relation | null {
  if (a.planet === b.planet) return null;
  if (a.signIndex === b.signIndex) return "conjunction";
  if (SIGN_LORDS[a.sign] === b.planet && SIGN_LORDS[b.sign] === a.planet) return "sign exchange";
  if (mutuallyAspect(a, b)) return "mutual aspect";
  return null;
}

/* Yoga strength from its planets' strengths. */
export function strengthFrom(planets: PlanetInfo[]): YogaStrength {
  const average = planets.reduce((sum, p) => sum + p.strength.score, 0) / planets.length;
  return strengthLabel(average);
}

const ORDER: YogaStrength[] = ["strong", "moderate", "weak", "cancelled"];

export function weaken(strength: YogaStrength, steps = 1): YogaStrength {
  return ORDER[Math.min(ORDER.indexOf(strength) + steps, ORDER.length - 1)];
}

export { ordinal } from "../math";

export function describe(p: PlanetInfo): string {
  return `${p.planet} in ${p.sign} (house ${p.house}, ${p.strength.label})`;
}

export type YogaRule = (core: ChartCore) => YogaResult[];
