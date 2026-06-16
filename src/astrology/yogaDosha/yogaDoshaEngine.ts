import {
  YogaDoshaDetection,
  YogaDoshaRule
} from "./types";

import {
  budhadityaYoga
} from "./yogas/budhadityaYoga";

import {
  gajakesariYoga
} from "./yogas/gajakesariYoga";

import {
  chandraMangalaYoga
} from "./yogas/chandraMangalaYoga";

import {
  manglikDosha
} from "./doshas/manglikDosha";

import {
  kemadrumaDosha
} from "./doshas/kemadrumaDosha";

import {
  guruChandalDosha
} from "./doshas/guruChandalDosha";

import {
  vipreetRajYoga
} from "./yogas/vipreetRajYoga";

import {
  neechaBhangaRajYoga
} from "./yogas/neechaBhangaRajYoga";

import {
  dharmaKarmaAdhipatiYoga
} from "./yogas/dharmaKarmaAdhipatiYoga";

import {
  shrapitDosha
} from "./doshas/shrapitDosha";

import {
  kaalSarpDosha
} from "./doshas/kaalSarpDosha";

import {
  pitraDosha
} from "./doshas/pitraDosha";

const RULES: YogaDoshaRule[] = [
  budhadityaYoga,
  gajakesariYoga,
  chandraMangalaYoga,
  vipreetRajYoga,
  manglikDosha,
  kemadrumaDosha,
  guruChandalDosha,
  neechaBhangaRajYoga,
  dharmaKarmaAdhipatiYoga,
  shrapitDosha,
  kaalSarpDosha,
  pitraDosha
];

export function evaluateYogaDoshaEngine(
  kernel: any
) {
  const allDetections:
    YogaDoshaDetection[] =
    RULES.map(
      rule =>
        rule.evaluate(kernel)
    );

  const detected =
    allDetections.filter(
      item => item.detected
    );

  const yogas =
    detected.filter(
      item =>
        item.category === "YOGA"
    );

  const doshas =
    detected.filter(
      item =>
        item.category === "DOSHA"
    );



  return {
    allDetections,
    detected,
    yogas,
    doshas,
    summary: {
      totalRulesChecked:
        RULES.length,

      detectedYogas:
        yogas.length,

      detectedDoshas:
        doshas.length
    }
  };
}