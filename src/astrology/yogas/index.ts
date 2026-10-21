import type { YogaResult } from "../types";
import type { ChartCore } from "../chart";
import { asYogaRules } from "./classical";
import { doshaRules } from "./doshas";
import { neechaBhangaRajaYoga } from "./neechaBhanga";

export { neechaBhangaFor } from "./neechaBhanga";

/*
  Every yoga and dosha present in the chart. Without a birth time the
  ascendant is unknown, so results that are counted from it are dropped
  rather than guessed.
*/
export function detectYogas(core: ChartCore): YogaResult[] {
  const rules = [...asYogaRules(), neechaBhangaRajaYoga, ...doshaRules()];

  return rules
    .flatMap((rule) => rule(core))
    .filter((yoga) => core.birthTimeKnown || !yoga.dependsOnAscendant);
}
