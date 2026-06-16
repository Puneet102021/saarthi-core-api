import {
  PlanetPosition
} from "../calculators/calculatePlanetaryPositions";

export interface TransitActivation {

  transitPlanet: string;

  natalPlanet: string;

  aspect: string;

  activationType:
    | "PRESSURE"
    | "SUPPORT"
    | "AMPLIFICATION";

  actualAngle: number;

  orb: number;
}

const ASPECTS = [

  {
    angle: 0,
    name: "Conjunction",
    orb: 8,
    type: "AMPLIFICATION"
  },

  {
    angle: 60,
    name: "Sextile",
    orb: 6,
    type: "SUPPORT"
  },

  {
    angle: 90,
    name: "Square",
    orb: 6,
    type: "PRESSURE"
  },

  {
    angle: 120,
    name: "Trine",
    orb: 6,
    type: "SUPPORT"
  },

  {
    angle: 180,
    name: "Opposition",
    orb: 8,
    type: "PRESSURE"
  }
];

function normalizeAngle(
  angle: number
): number {

  let normalized =
    angle % 360;

  if (normalized < 0) {
    normalized += 360;
  }

  return normalized;
}

function angularDistance(
  a: number,
  b: number
): number {

  const diff =
    Math.abs(a - b);

  return Math.min(
    diff,
    360 - diff
  );
}

export function buildTransitActivations({

  transitPlanets,

  natalPlanets

}: {

  transitPlanets: PlanetPosition[];

  natalPlanets: PlanetPosition[];

}): TransitActivation[] {

  const activations:
    TransitActivation[] = [];

  for (
    const transitPlanet
    of transitPlanets
  ) {

    for (
      const natalPlanet
      of natalPlanets
    ) {

      /*
        Skip same planet
      */

      if (
        transitPlanet.planet ===
        natalPlanet.planet
      ) {

        continue;
      }

      const angle =
        angularDistance(

          normalizeAngle(
            transitPlanet.longitude
          ),

          normalizeAngle(
            natalPlanet.longitude
          )
        );

      for (
        const aspect
        of ASPECTS
      ) {

        const orb =
          Math.abs(
            angle -
            aspect.angle
          );

        if (
          orb <= aspect.orb
        ) {

          activations.push({

            transitPlanet:
              transitPlanet.planet,

            natalPlanet:
              natalPlanet.planet,

            aspect:
              aspect.name,

            activationType:
              aspect.type as
                | "PRESSURE"
                | "SUPPORT"
                | "AMPLIFICATION",

            actualAngle:
              Number(
                angle.toFixed(2)
              ),

            orb:
              Number(
                orb.toFixed(2)
              )
          });

          break;
        }
      }
    }
  }

  return activations;
}
