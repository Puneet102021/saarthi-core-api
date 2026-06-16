import {
  YogaDoshaRule
} from "../types";

import {
  getPlanet,
  areInSameHouse,
  createNotDetected
} from "../utils";

export const shrapitDosha:
  YogaDoshaRule = {

  id: "SHRAPIT_DOSHA",

  name: "Shrapit Dosha",

  category: "DOSHA",

  evaluate(kernel: any) {

    const saturn =
      getPlanet(
        kernel,
        "Saturn"
      );

    const rahu =
      getPlanet(
        kernel,
        "Rahu"
      );

    if (
      !saturn ||
      !rahu
    ) {

      return createNotDetected(

        this.id,

        this.name,

        this.category,

        "Saturn or Rahu missing."
      );
    }

    const detected =
      areInSameHouse(
        saturn,
        rahu
      );

    if (!detected) {

      return createNotDetected(

        this.id,

        this.name,

        this.category,

        "Saturn and Rahu are not in the same house."
      );
    }

    return {

      id: this.id,

      name: this.name,

      category: this.category,

      detected: true,

      confidence: "HIGH",

      participants: [
        "Saturn",
        "Rahu"
      ],

      supportingStructures: [

        `Saturn and Rahu are both placed in house ${saturn.house}`
      ]
    };
  }
};