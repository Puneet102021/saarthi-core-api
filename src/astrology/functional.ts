import { Planet, SEVEN_PLANETS, SIGN_LORDS } from "./constants";
import { signAt } from "./math";
import type { FunctionalNature } from "./types";

/* Houses (from the ascendant) that each of the seven planets rules. */
export function ownedHouses(ascendantSignIndex: number): Record<Planet, number[]> {
  const owned = Object.fromEntries(
    [...SEVEN_PLANETS, "Rahu", "Ketu"].map((p) => [p, [] as number[]])
  ) as Record<Planet, number[]>;

  for (let house = 1; house <= 12; house++) {
    const lord = SIGN_LORDS[signAt(ascendantSignIndex + house - 1)];
    owned[lord].push(house);
  }

  return owned;
}

const NATURAL_BENEFICS: Planet[] = ["Jupiter", "Venus", "Mercury", "Moon"];

/*
  Functional nature for the ascendant (Parashari lordship rules):
  - trikona lords (1, 5, 9) are benefic, and the ascendant lord always is;
  - a planet ruling both a kendra (4, 7, 10) and a trikona (5, 9) is a yogakaraka;
  - lords of 3, 6 and 11 are malefic, and so is the 8th lord unless it also
    rules the ascendant (the Sun and Moon carry no 8th-lord blemish);
  - natural benefics that rule only kendras lose some beneficence
    (kendradhipati dosha); 2nd and 12th lordship is neutral.
*/
export function functionalNature(planet: Planet, owned: number[]): FunctionalNature {
  if (owned.length === 0) return "neutral";

  const ownsKendra = owned.some((h) => [4, 7, 10].includes(h));
  const ownsTrikona = owned.some((h) => [5, 9].includes(h));

  if (ownsKendra && ownsTrikona) return "yogakaraka";

  let score = 0;

  for (const house of owned) {
    if ([1, 5, 9].includes(house)) score += 2;
    else if ([3, 11].includes(house)) score -= 1;
    else if (house === 6) score -= 1.5;
    else if (house === 8) {
      const exempt = planet === "Sun" || planet === "Moon" || owned.includes(1);
      if (!exempt) score -= 1.5;
    } else if ([4, 7, 10].includes(house) && NATURAL_BENEFICS.includes(planet)) {
      score -= 0.5;
    }
  }

  if (owned.includes(1)) return "benefic";
  if (score > 0.5) return "benefic";
  if (score < -0.5) return "malefic";
  return "neutral";
}

/* Lords of the 2nd and 7th are marakas. */
export function isMaraka(owned: number[]): boolean {
  return owned.includes(2) || owned.includes(7);
}
