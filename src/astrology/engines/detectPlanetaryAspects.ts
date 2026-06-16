import {
  PlanetPosition
} from "../calculators/calculatePlanetaryPositions";

export type AspectType =
  | "Conjunction"
  | "Sextile"
  | "Square"
  | "Trine"
  | "Opposition";

export interface PlanetaryAspect {

  planet1: string;

  planet2: string;

  aspect: AspectType;

  exactAngle: number;

  actualAngle: number;

  orb: number;
}

interface AspectDefinition {

  aspect: AspectType;

  angle: number;

  maxOrb: number;
}

const ASPECTS: AspectDefinition[] = [

  {
    aspect: "Conjunction",
    angle: 0,
    maxOrb: 8
  },

  {
    aspect: "Sextile",
    angle: 60,
    maxOrb: 6
  },

  {
    aspect: "Square",
    angle: 90,
    maxOrb: 6
  },

  {
    aspect: "Trine",
    angle: 120,
    maxOrb: 6
  },

  {
    aspect: "Opposition",
    angle: 180,
    maxOrb: 8
  }
];

function getAngularDistance(
  longitude1: number,
  longitude2: number
): number {

  const rawDifference =
    Math.abs(
      longitude1 -
      longitude2
    );

  return Math.min(
    rawDifference,
    360 - rawDifference
  );
}

export function detectPlanetaryAspects(
  planets: PlanetPosition[]
): PlanetaryAspect[] {

  const aspects: PlanetaryAspect[] = [];

  for (
    let i = 0;
    i < planets.length;
    i++
  ) {

    for (
      let j = i + 1;
      j < planets.length;
      j++
    ) {

      const planet1 =
        planets[i];

      const planet2 =
        planets[j];

      const actualAngle =
        getAngularDistance(
          planet1.longitude,
          planet2.longitude
        );

      for (const aspectDef of ASPECTS) {

        const orb =
          Math.abs(
            actualAngle -
            aspectDef.angle
          );

        if (
          orb <= aspectDef.maxOrb
        ) {

          aspects.push({

            planet1:
              planet1.planet,

            planet2:
              planet2.planet,

            aspect:
              aspectDef.aspect,

            exactAngle:
              aspectDef.angle,

            actualAngle:
              Number(
                actualAngle.toFixed(4)
              ),

            orb:
              Number(
                orb.toFixed(4)
              )
          });

          break;
        }
      }
    }
  }

  return aspects.sort(
    (a, b) =>
      a.orb -
      b.orb
  );
}