import {
  YogaDoshaRule
} from "../types";

import {
  getPlanet,
  createNotDetected
} from "../utils";

const MANGLIK_HOUSES = [
  1,
  2,
  4,
  7,
  8,
  12
];

export const manglikDosha: YogaDoshaRule = {
  id: "MANGLIK_DOSHA",

  name: "Manglik Dosha",

  category: "DOSHA",

  evaluate(kernel: any) {
    const mars =
      getPlanet(kernel, "Mars");

    if (!mars) {
      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "Mars placement missing."
      );
    }

    const detected =
      MANGLIK_HOUSES.includes(
        mars.house
      );

    if (!detected) {
      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "Mars is not placed in a Manglik house."
      );
    }

    let confidence:
      | "MEDIUM"
      | "HIGH" =
      "MEDIUM";

    if (
      [7, 8].includes(
        mars.house
      )
    ) {
      confidence = "HIGH";
    }

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      detected: true,
      confidence,
      participants: [
        "Mars"
      ],
      supportingStructures: [
        `Mars is placed in house ${mars.house}.`,
        `Manglik houses considered: ${MANGLIK_HOUSES.join(", ")}.`
      ]
    };
  }
};