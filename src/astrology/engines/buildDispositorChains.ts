import {
  PlanetPosition
} from "../calculators/calculatePlanetaryPositions";

import {
  getSignLord
} from "./buildSignLords";

export interface DispositorStep {

  sign: string;

  lord: string;
}

export interface DispositorChain {

  planet: string;

  chain: DispositorStep[];

  terminalPlanet: string;

  isClosedLoop: boolean;
}

interface BuildDispositorChainsInput {

  planets: PlanetPosition[];

  maxDepth?: number;
}

export function buildDispositorChains({

  planets,

  maxDepth = 10

}: BuildDispositorChainsInput):

  DispositorChain[] {

  return planets.map(
    (planet) => {

      const chain:
        DispositorStep[] = [];

      const visitedPlanets =
        new Set<string>();

      let currentPlanet =
        planet;

      let terminalPlanet =
        currentPlanet.planet;

      let isClosedLoop =
        false;

      for (
        let depth = 0;
        depth < maxDepth;
        depth++
      ) {

        const lord =
          getSignLord(
            currentPlanet.sign
          );

        chain.push({

          sign:
            currentPlanet.sign,

          lord
        });

        /*
          Closed loop
          detected
        */

        if (
          visitedPlanets.has(
            lord
          )
        ) {

          terminalPlanet =
            lord;

          isClosedLoop =
            true;

          break;
        }

        visitedPlanets.add(
          lord
        );

        const nextPlanet =
          planets.find(
            (p) =>
              p.planet ===
              lord
          );

        /*
          Terminal node
        */

        if (!nextPlanet) {

          terminalPlanet =
            lord;

          break;
        }

        terminalPlanet =
          nextPlanet.planet;

        currentPlanet =
          nextPlanet;
      }

      return {

        planet:
          planet.planet,

        chain,

        terminalPlanet,

        isClosedLoop
      };
    }
  );
}