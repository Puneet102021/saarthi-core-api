import {
  YogaDoshaRule
} from "../types";

import {
  createNotDetected
} from "../utils";

export const kaalSarpDosha:
  YogaDoshaRule = {

  id: "KAAL_SARP_DOSHA",

  name: "Kaal Sarp Dosha",

  category: "DOSHA",

  evaluate(kernel: any) {

    const placements =
      kernel.placements || [];

      console.log(
  "KAAL_SARP_RAW_PLACEMENT",
  JSON.stringify(
    placements[0],
    null,
    2
  )
);

console.log(
  "KAAL_SARP_LONGITUDES",
  placements.map(
    p => ({
      planet: p.planet,
      longitude: p.longitude
    })
  )
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

    if (!rahu || !ketu) {

      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "Rahu or Ketu missing."
      );
    }

    const classicalPlanets = [

      "Sun",
      "Moon",
      "Mars",
      "Mercury",
      "Jupiter",
      "Venus",
      "Saturn"
    ];

    const planets =
      placements.filter(
        (p: any) =>
          classicalPlanets.includes(
            p.planet
          )
      );

    const rahuLon =
      rahu.longitude;

    const ketuLon =
      ketu.longitude;

    const isBetween = (
      value: number,
      start: number,
      end: number
    ) => {

      if (start < end) {

        return (
          value >= start &&
          value <= end
        );
      }

      return (
        value >= start ||
        value <= end
      );
    };

    const allInside =
      planets.every(
        (planet: any) =>
          isBetween(
            planet.longitude,
            rahuLon,
            ketuLon
          )
      );

    if (!allInside) {

      return createNotDetected(
        this.id,
        this.name,
        this.category,
        "All planets are not enclosed between Rahu and Ketu."
      );
    }

    return {

      id: this.id,

      name: this.name,

      category: "DOSHA",

      detected: true,

      confidence: "HIGH",

      participants: [

        "Rahu",
        "Ketu"
      ],

      supportingStructures: [

        "All seven classical planets fall within the Rahu-Ketu axis."
      ]
    };
  }
};