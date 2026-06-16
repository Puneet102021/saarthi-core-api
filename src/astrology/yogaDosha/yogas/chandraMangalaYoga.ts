import {
  YogaDoshaRule
} from "../types";

import {
  getPlanet,
  areInSameHouse,
  createNotDetected
} from "../utils";

export const chandraMangalaYoga: YogaDoshaRule = {
  id: "CHANDRA_MANGALA_YOGA",

  name: "Chandra Mangala Yoga",

  category: "YOGA",

  evaluate(kernel: any) {
    const moon =
      getPlanet(kernel, "Moon");

    const mars =
      getPlanet(kernel, "Mars");

    if (!moon || !mars) {
      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "Moon or Mars placement missing."
      );
    }

    const detected =
      areInSameHouse(
        moon,
        mars
      );

    if (!detected) {
      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "Moon and Mars are not in the same house."
      );
    }

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      detected: true,
      confidence: "HIGH",
      participants: [
        "Moon",
        "Mars"
      ],
      supportingStructures: [
        `Moon and Mars are both placed in house ${moon.house}.`,
        `Moon is in ${moon.sign}.`,
        `Mars is in ${mars.sign}.`
      ]
    };
  }
};