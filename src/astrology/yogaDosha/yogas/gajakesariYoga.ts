import {
  YogaDoshaRule
} from "../types";

import {
  getPlanet,
  areInKendraFromEachOther,
  getHouseDistance,
  createNotDetected
} from "../utils";

export const gajakesariYoga: YogaDoshaRule = {
  id: "GAJAKESARI_YOGA",

  name: "Gajakesari Yoga",

  category: "YOGA",

  evaluate(kernel: any) {
    const moon =
      getPlanet(kernel, "Moon");

    const jupiter =
      getPlanet(kernel, "Jupiter");

    if (!moon || !jupiter) {
      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "Moon or Jupiter placement missing."
      );
    }

    const detected =
      areInKendraFromEachOther(
        moon,
        jupiter
      );

    if (!detected) {
      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "Jupiter is not in a Kendra from Moon."
      );
    }

    const distance =
      getHouseDistance(
        moon.house,
        jupiter.house
      );

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      detected: true,
      confidence: "HIGH",
      participants: [
        "Moon",
        "Jupiter"
      ],
      supportingStructures: [
        `Moon is placed in house ${moon.house}.`,
        `Jupiter is placed in house ${jupiter.house}.`,
        `Jupiter is ${distance} houses from Moon, forming a Kendra relationship.`
      ]
    };
  }
};