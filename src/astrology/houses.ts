import { DUSTHANA, KENDRA, Planet, SIGN_LORDS, UPACHAYA } from "./constants";
import { planetsAspecting } from "./aspects";
import { DIGNITY_LABEL } from "./dignity";
import { houseFrom, round, signAt } from "./math";
import { strengthLabel } from "./strength";
import type { HouseInfo, PlanetInfo } from "./types";

/*
  Each house is judged on three things, in the Parashari way: its lord (how
  strong, and where it sits from the ascendant and from the house itself),
  the planets occupying it, and the planets aspecting it.
*/
export function buildHouses(
  ascendantSignIndex: number,
  planets: PlanetInfo[]
): HouseInfo[] {
  const byName = new Map(planets.map((p) => [p.planet, p]));

  const houses: HouseInfo[] = [];

  for (let house = 1; house <= 12; house++) {
    const sign = signAt(ascendantSignIndex + house - 1);
    const lord = SIGN_LORDS[sign];
    const lordInfo = byName.get(lord) as PlanetInfo;

    const occupants = planets.filter((p) => p.house === house).map((p) => p.planet);
    const aspectedBy = planetsAspecting(house, planets).filter((p) => !occupants.includes(p));

    const influencers = [...occupants, ...aspectedBy];

    const beneficInfluences = influencers.filter(
      (p) => byName.get(p)?.naturalNature === "benefic"
    );
    const maleficInfluences = influencers.filter(
      (p) => byName.get(p)?.naturalNature === "malefic"
    );

    const lordFromHouse = houseFrom(house - 1, lordInfo.house - 1);

    const notes: string[] = [];
    let score = 50;

    score += (lordInfo.strength.score - 50) * 0.5;
    notes.push(
      `lord ${lord} is ${lordInfo.strength.label} (${lordInfo.strength.score}/100)` +
        (lordInfo.dignity ? `, ${DIGNITY_LABEL[lordInfo.dignity]}` : "")
    );

    if (KENDRA.includes(lordInfo.house) || [5, 9].includes(lordInfo.house)) {
      score += 8;
      notes.push(`lord sits in house ${lordInfo.house}, a kendra or trikona`);
    } else if (DUSTHANA.includes(lordInfo.house)) {
      if (DUSTHANA.includes(house)) {
        notes.push(
          `lord of a dusthana sits in another dusthana (house ${lordInfo.house}), which can turn difficulty to advantage`
        );
      } else {
        score -= 8;
        notes.push(`lord sits in house ${lordInfo.house}, a dusthana`);
      }
    }

    if ([6, 8, 12].includes(lordFromHouse) && !DUSTHANA.includes(house)) {
      score -= 6;
      notes.push(`lord is ${lordFromHouse} houses from the house itself`);
    }

    const upachaya = UPACHAYA.includes(house);

    for (const planet of influencers) {
      const info = byName.get(planet) as PlanetInfo;
      const how = occupants.includes(planet) ? "occupies" : "aspects";

      if (info.naturalNature === "benefic") {
        score += info.strength.label === "weak" ? 3 : 6;
        notes.push(`benefic ${planet} ${how} it`);
      } else if (upachaya) {
        score += 3;
        notes.push(`malefic ${planet} ${how} it, which helps a growth (upachaya) house`);
      } else {
        score -= info.strength.label === "strong" ? 4 : 6;
        notes.push(`malefic ${planet} ${how} it`);
      }
    }

    const clamped = Math.max(0, Math.min(100, Math.round(score)));

    houses.push({
      house,
      sign,
      lord,
      lordHouse: lordInfo.house,
      lordFromHouse,
      lordDignity: lordInfo.dignity,
      lordStrength: lordInfo.strength.score,
      occupants,
      aspectedBy,
      beneficInfluences,
      maleficInfluences,
      score: round(clamped, 0),
      label: strengthLabel(clamped),
      notes
    });
  }

  return houses;
}

export function houseLord(houses: HouseInfo[], house: number): Planet {
  return houses[house - 1].lord;
}
