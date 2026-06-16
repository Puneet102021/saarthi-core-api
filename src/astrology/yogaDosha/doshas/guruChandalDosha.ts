import {
  YogaDoshaRule
} from "../types";

import {
  getPlanet,
  areInSameHouse,
  createNotDetected
} from "../utils";

export const guruChandalDosha: YogaDoshaRule = {
  id: "GURU_CHANDAL_DOSHA",

  name: "Guru Chandal Dosha",

  category: "DOSHA",

  evaluate(kernel: any) {
    const jupiter =
      getPlanet(kernel, "Jupiter");

    const rahu =
      getPlanet(kernel, "Rahu");

    const ketu =
      getPlanet(kernel, "Ketu");

    if (!jupiter) {
      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "Jupiter placement missing."
      );
    }

    const withRahu =
      rahu &&
      areInSameHouse(
        jupiter,
        rahu
      );

    const withKetu =
      ketu &&
      areInSameHouse(
        jupiter,
        ketu
      );

    const detected =
      Boolean(
        withRahu ||
        withKetu
      );

    if (!detected) {
      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "Jupiter is not placed with Rahu or Ketu."
      );
    }

    const node =
      withRahu
        ? "Rahu"
        : "Ketu";

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      detected: true,
      confidence: "HIGH",
      participants: [
        "Jupiter",
        node
      ],
      supportingStructures: [
        `Jupiter is placed in house ${jupiter.house}.`,
        `${node} is placed in the same house.`
      ]
    };
  }
};