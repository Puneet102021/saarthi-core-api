import {
  YogaDoshaRule
} from "../types";

import {
  createNotDetected
} from "../utils";

export const neechaBhangaRajYoga:
  YogaDoshaRule = {

  id: "NEECHA_BHANGA_RAJ_YOGA",

  name: "Neecha Bhanga Raj Yoga",

  category: "YOGA",

  evaluate(kernel: any) {

    const dignities =
      kernel.planetDignities || [];

    const placements =
      kernel.placements || [];

    const signLords =
      kernel.signLords || {};

    const moon =
      placements.find(
        (p: any) =>
          p.planet === "Moon"
      );

    const matches: any[] = [];

    for (
      const dignity
      of dignities
    ) {

      if (
        dignity.dignity !==
        "DEBILITATED"
      ) {
        continue;
      }

      const debilitatedPlanet =
        dignity.planet;

      const placement =
        placements.find(
          (p: any) =>
            p.planet ===
            debilitatedPlanet
        );

      if (!placement) {
        continue;
      }

      const signLord =
        signLords[
          placement.sign
        ];

      const dispositor =
        placements.find(
          (p: any) =>
            p.planet ===
            signLord
        );

      if (!dispositor) {
        continue;
      }

      const lagnaKendra =
        [1, 4, 7, 10]
          .includes(
            dispositor.house
          );

      const moonKendra =
        moon
          ? [1, 4, 7, 10]
              .includes(
                (
                  (dispositor.house -
                    moon.house +
                    12) %
                    12
                ) + 1
              )
          : false;

      if (
        lagnaKendra ||
        moonKendra
      ) {

        matches.push({

          planet:
            debilitatedPlanet,

          sign:
            placement.sign,

          dispositor:
            signLord,

          dispositorHouse:
            dispositor.house,

          lagnaKendra,

          moonKendra
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

        "No debilitated planet satisfied cancellation conditions."
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
          m => m.planet
        ),

      supportingStructures:
        matches.map(
          m =>
            `${m.planet} is debilitated in ${m.sign}; dispositor ${m.dispositor} occupies house ${m.dispositorHouse}`
        )
    };
  }
};