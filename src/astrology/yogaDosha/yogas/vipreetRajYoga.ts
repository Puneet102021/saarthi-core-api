import {
  YogaDoshaRule
} from "../types";

import {
  createNotDetected
} from "../utils";

export const vipreetRajYoga:
  YogaDoshaRule = {

  id: "VIPREET_RAJ_YOGA",

  name: "Vipreet Raj Yoga",

  category: "YOGA",

  evaluate(kernel: any) {

    const houseLords =
      kernel.houseLords || [];

    const placements =
      kernel.placements || [];

    const difficultHouses =
      [6, 8, 12];

    const qualifyingLords =
      houseLords.filter(
        (h: any) =>
          difficultHouses.includes(
            h.house
          )
      );

    const matches: any[] = [];

    for (
      const lordInfo
      of qualifyingLords
    ) {

      const placement =
        placements.find(
          (p: any) =>
            p.planet ===
            lordInfo.lord
        );

      if (!placement) {
        continue;
      }

      if (
        difficultHouses.includes(
          placement.house
        )
      ) {

        matches.push({

          house:
            lordInfo.house,

          lord:
            lordInfo.lord,

          placementHouse:
            placement.house
        });
      }
    }

    if (
      matches.length === 0
    ) {

      return createNotDetected(

        this.id,

        this.name,

        this.category,

        "No dusthana lord occupies a dusthana house."
      );
    }

    return {

      id: this.id,

      name: this.name,

      category: this.category,

      detected: true,

      confidence:
        matches.length >= 2
          ? "HIGH"
          : "MEDIUM",

      participants:
        matches.map(
          m => m.lord
        ),

      supportingStructures:
        matches.map(
          m =>
            `${m.lord} rules house ${m.house} and is placed in house ${m.placementHouse}`
        )
    };
  }
};