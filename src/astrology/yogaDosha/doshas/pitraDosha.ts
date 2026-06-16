import {
  YogaDoshaRule
} from "../types";

import {
  createNotDetected
} from "../utils";

export const pitraDosha:
  YogaDoshaRule = {

  id: "PITRA_DOSHA",

  name: "Pitra Dosha",

  category: "DOSHA",

  evaluate(kernel: any) {

    const placements =
      kernel.placements || [];

    const houseLords =
      kernel.houseLords || [];

    const sun =
      placements.find(
        (p: any) =>
          p.planet === "Sun"
      );

    const rahu =
      placements.find(
        (p: any) =>
          p.planet === "Rahu"
      );

    const ketu =
      placements.find(
        (p: any) =>
          p.planet === "Ketu"
      );

    const ninthLord =
      houseLords.find(
        (h: any) =>
          h.house === 9
      )?.lord;

    const ninthLordPlacement =
      placements.find(
        (p: any) =>
          p.planet === ninthLord
      );

    const triggers: string[] = [];

    if (
      sun &&
      rahu &&
      sun.house === rahu.house
    ) {

      triggers.push(
        "Sun conjunct Rahu"
      );
    }

    if (
      sun &&
      ketu &&
      sun.house === ketu.house
    ) {

      triggers.push(
        "Sun conjunct Ketu"
      );
    }

    if (
      rahu?.house === 9
    ) {

      triggers.push(
        "Rahu in 9th house"
      );
    }

    if (
      ketu?.house === 9
    ) {

      triggers.push(
        "Ketu in 9th house"
      );
    }

    if (
      ninthLordPlacement &&
      rahu &&
      ninthLordPlacement.house === rahu.house
    ) {

      triggers.push(
        `${ninthLord} conjunct Rahu`
      );
    }

    if (
      ninthLordPlacement &&
      ketu &&
      ninthLordPlacement.house === ketu.house
    ) {

      triggers.push(
        `${ninthLord} conjunct Ketu`
      );
    }

    if (
      triggers.length === 0
    ) {

      return createNotDetected(

        this.id,

        this.name,

        this.category,

        "No Pitra Dosha indicators found."
      );
    }

    return {

      id: this.id,

      name: this.name,

      category: "DOSHA",

      detected: true,

      confidence:
        triggers.length >= 2
          ? "HIGH"
          : "MEDIUM",

      participants: [

        "Sun",

        "Rahu",

        "Ketu",

        ninthLord
      ].filter(Boolean),

      supportingStructures:
        triggers
    };
  }
};