import { Planet, SPECIAL_ASPECTS } from "./constants";

/* Houses a planet in `house` casts graha drishti on (whole-sign). */
export function aspectedHouses(planet: Planet, house: number): number[] {
  return SPECIAL_ASPECTS[planet].map((offset) => ((house + offset - 2) % 12) + 1);
}

/* Planets that aspect `targetHouse`, given every planet's house. */
export function planetsAspecting(
  targetHouse: number,
  placements: { planet: Planet; house: number }[]
): Planet[] {
  return placements
    .filter(({ planet, house }) => aspectedHouses(planet, house).includes(targetHouse))
    .map(({ planet }) => planet);
}

/* Planets sharing a sign with `planet` (conjunction by sign). */
export function conjunctPlanets(
  planet: Planet,
  placements: { planet: Planet; house: number }[]
): Planet[] {
  const own = placements.find((p) => p.planet === planet);
  if (!own) return [];
  return placements
    .filter((p) => p.planet !== planet && p.house === own.house)
    .map((p) => p.planet);
}

export function aspects(
  from: { planet: Planet; house: number },
  to: { house: number }
): boolean {
  return aspectedHouses(from.planet, from.house).includes(to.house);
}

/* Two planets aspect each other (each one's drishti falls on the other's house). */
export function mutuallyAspect(
  a: { planet: Planet; house: number },
  b: { planet: Planet; house: number }
): boolean {
  return aspects(a, b) && aspects(b, a);
}
