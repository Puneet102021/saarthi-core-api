import {
  YogaDoshaRule
} from "../types";

import {
  createNotDetected
} from "../utils";

export const dharmaKarmaAdhipatiYoga:
  YogaDoshaRule = {

  id: "DHARMA_KARMA_ADHIPATI_YOGA",

  name: "Dharma Karma Adhipati Yoga",

  category: "YOGA",

  evaluate(kernel: any) {

    const houseLords =
      kernel.houseLords || [];

    const placements =
      kernel.placements || [];

    const aspects =
      kernel.planetaryAspects || [];

    const ninthLord =
      houseLords.find(
        (h: any) =>
          h.house === 9
      )?.lord;

    const tenthLord =
      houseLords.find(
        (h: any) =>
          h.house === 10
      )?.lord;

    if (
      !ninthLord ||
      !tenthLord
    ) {

      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "9th or 10th lord missing."
      );
    }

    const ninthPlacement =
      placements.find(
        (p: any) =>
          p.planet ===
          ninthLord
      );

    const tenthPlacement =
      placements.find(
        (p: any) =>
          p.planet ===
          tenthLord
      );

    const conjunction =
      ninthPlacement &&
      tenthPlacement &&
      ninthPlacement.house ===
      tenthPlacement.house;

    const aspect =
      aspects.some(
        (a: any) =>
          (
            a.planet1 ===
              ninthLord &&
            a.planet2 ===
              tenthLord
          ) ||
          (
            a.planet1 ===
              tenthLord &&
            a.planet2 ===
              ninthLord
          )
      );

    const detected =
      conjunction ||
      aspect;

    if (!detected) {

      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "No conjunction or aspect between 9th and 10th lord."
      );
    }

    return {

      id: this.id,

      name: this.name,

      category: this.category,

      detected: true,

      confidence:
        conjunction
          ? "HIGH"
          : "MEDIUM",

      participants: [
        ninthLord,
        tenthLord
      ],

      supportingStructures: [

        conjunction
          ? `${ninthLord} and ${tenthLord} occupy house ${ninthPlacement.house}`
          : `${ninthLord} and ${tenthLord} form a major aspect`
      ]
    };
  }
};