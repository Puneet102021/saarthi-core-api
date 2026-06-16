import {
  YogaDoshaRule
} from "../types";

import {
  getPlanet,
  areInSameHouse,
  createNotDetected
} from "../utils";

export const budhadityaYoga: YogaDoshaRule = {
  id: "BUDHADITYA_YOGA",

  name: "Budhaditya Yoga",

  category: "YOGA",

  evaluate(kernel: any) {
    const sun =
      getPlanet(kernel, "Sun");

    const mercury =
      getPlanet(kernel, "Mercury");

    if (!sun || !mercury) {
      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "Sun or Mercury placement missing."
      );
    }

    const detected =
      areInSameHouse(
        sun,
        mercury
      );

    if (!detected) {
      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "Sun and Mercury are not in the same house."
      );
    }

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      detected: true,
      confidence: "HIGH",
      participants: [
        "Sun",
        "Mercury"
      ],
      supportingStructures: [
        `Sun and Mercury are both placed in house ${sun.house}.`,
        `Sun is in ${sun.sign}.`,
        `Mercury is in ${mercury.sign}.`
      ]
    };
  }
};