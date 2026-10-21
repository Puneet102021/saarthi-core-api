import { DIG_BALA_HOUSE, DUSTHANA, KENDRA, Planet, UPACHAYA } from "./constants";
import { DIGNITY_LABEL } from "./dignity";
import { round } from "./math";
import type { Dignity, Strength, StrengthLabel } from "./types";

/*
  Planet strength on a 0-100 scale, built from named components so every
  number can be explained to the reader. It approximates the main ideas of
  Shadbala (positional, directional, motional and aspectual strength) but is
  not a Shadbala calculation and should not be presented as one.
*/

const DIGNITY_POINTS: Record<Dignity, number> = {
  exalted: 30,
  moolatrikona: 22,
  own: 18,
  great_friend: 12,
  friend: 8,
  neutral: 0,
  enemy: -8,
  great_enemy: -12,
  debilitated: -30
};

export interface StrengthInput {
  planet: Planet;
  house: number;
  dignity: Dignity | null;
  d9Dignity: Dignity | null;
  vargottama: boolean;
  combust: boolean;
  retrograde: boolean;
  naturalNature: "benefic" | "malefic";
  /* Moon only: angular distance from the Sun, 0-180. */
  moonElongation?: number;
  beneficInfluences: Planet[];
  maleficInfluences: Planet[];
  /* Rahu and Ketu: strength of the sign lord they occupy. */
  dispositorScore?: number;
  /* Neecha bhanga found for this planet. */
  debilitationCancelled?: boolean;
}

export function strengthLabel(score: number): StrengthLabel {
  if (score >= 65) return "strong";
  if (score >= 45) return "moderate";
  return "weak";
}

export function planetStrength(input: StrengthInput): Strength {
  const reasons: string[] = [];
  let score = 50;

  const add = (points: number, reason: string) => {
    if (points === 0) return;
    score += points;
    reasons.push(`${points > 0 ? "+" : ""}${round(points, 1)} ${reason}`);
  };

  const isNode = input.planet === "Rahu" || input.planet === "Ketu";

  if (isNode) {
    if (input.dispositorScore !== undefined) {
      add(round((input.dispositorScore - 50) * 0.5, 1), "from the strength of its sign lord");
    }
    if ([3, 6, 11].includes(input.house)) add(8, `in house ${input.house}, where the nodes do well`);
    if ([8, 12].includes(input.house)) add(-8, `in house ${input.house}`);
  } else {
    if (input.dignity) {
      let points = DIGNITY_POINTS[input.dignity];
      if (input.dignity === "debilitated" && input.debilitationCancelled) {
        points = -10;
        add(points, "debilitated, with the debilitation cancelled (neecha bhanga)");
      } else {
        add(points, DIGNITY_LABEL[input.dignity]);
      }
    }

    if (KENDRA.includes(input.house) || [5, 9].includes(input.house)) {
      add(10, `in house ${input.house} (kendra or trikona)`);
    } else if (DUSTHANA.includes(input.house)) {
      const maleficInUpachaya =
        input.naturalNature === "malefic" && UPACHAYA.includes(input.house);
      add(
        maleficInUpachaya ? 4 : -10,
        maleficInUpachaya
          ? `natural malefic in house ${input.house} (upachaya)`
          : `in house ${input.house} (dusthana)`
      );
    } else if (input.naturalNature === "malefic" && UPACHAYA.includes(input.house)) {
      add(6, `natural malefic in house ${input.house} (upachaya)`);
    } else if ([2, 11].includes(input.house)) {
      add(4, `in house ${input.house}`);
    }

    if (DIG_BALA_HOUSE[input.planet] === input.house) {
      add(8, `directional strength (dig bala) in house ${input.house}`);
    }

    if (input.combust) add(-15, "combust (too close to the Sun)");

    if (input.retrograde && input.planet !== "Sun" && input.planet !== "Moon") {
      add(5, "retrograde (motional strength)");
    }

    if (input.vargottama) add(10, "vargottama (same sign in D1 and D9)");

    if (input.d9Dignity === "exalted" || input.d9Dignity === "own") {
      add(8, `${input.d9Dignity === "own" ? "own sign" : "exalted"} in the navamsa (D9)`);
    } else if (input.d9Dignity === "debilitated") {
      add(-8, "debilitated in the navamsa (D9)");
    }

    if (input.planet === "Moon" && input.moonElongation !== undefined) {
      if (input.moonElongation >= 120) add(8, "bright Moon (far from the Sun)");
      else if (input.moonElongation < 60) add(-8, "dim Moon (close to the Sun)");
    }
  }

  const benefics = input.beneficInfluences.filter((p) => p !== input.planet);
  const malefics = input.maleficInfluences.filter((p) => p !== input.planet);

  if (benefics.length) {
    add(Math.min(benefics.length * 4, 12), `aspected or joined by benefics (${benefics.join(", ")})`);
  }
  if (malefics.length) {
    add(-Math.min(malefics.length * 4, 12), `aspected or joined by malefics (${malefics.join(", ")})`);
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score: clamped,
    label: strengthLabel(clamped),
    reasons
  };
}
