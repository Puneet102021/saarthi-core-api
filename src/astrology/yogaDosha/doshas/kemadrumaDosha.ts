import {
  YogaDoshaRule
} from "../types";

import {
  getPlanet,
  createNotDetected
} from "../utils";

export const kemadrumaDosha: YogaDoshaRule = {
  id: "KEMADRUMA_DOSHA",

  name: "Kemadruma Dosha",

  category: "DOSHA",

  evaluate(kernel: any) {
    const moon =
      getPlanet(kernel, "Moon");

    if (!moon) {
      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "Moon placement missing."
      );
    }

    const planets =
      kernel.placements || [];

    const previousHouse =
      moon.house === 1
        ? 12
        : moon.house - 1;

    const nextHouse =
      moon.house === 12
        ? 1
        : moon.house + 1;

    const planetsAroundMoon =
      planets.filter(
        (p: any) =>
          p.planet !== "Moon" &&
          [
            previousHouse,
            nextHouse
          ].includes(p.house)
      );

    const detected =
      planetsAroundMoon.length === 0;

    if (!detected) {
      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "Planets are present in houses adjacent to Moon."
      );
    }

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      detected: true,
      confidence: "MEDIUM",
      participants: [
        "Moon"
      ],
      supportingStructures: [
        `Moon is placed in house ${moon.house}.`,
        `No planets found in adjacent houses ${previousHouse} and ${nextHouse}.`
      ]
    };
  }
};