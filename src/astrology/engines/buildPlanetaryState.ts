import {
  PlanetPosition
} from "../calculators/calculatePlanetaryPositions";

import {
  PlanetHousePlacement
} from "../builders/mapPlanetsToHouses";

import {
  PlanetDignity
} from "./buildPlanetDignities";

import {
  FunctionalRole
} from "./buildFunctionalRoles";

import {
  ReinforcementNode
} from "./buildReinforcementGraph";

import {
  AxisActivation
} from "./buildAxisActivations";

import {
  DispositorChain
} from "./buildDispositorChains";

export interface PlanetaryState {

  planet: string;

  state: {

    placement: {

      sign: string;

      house: number;

      nakshatra: string;

      retrograde: boolean;
    };

    dignity: string[];

    roles: string[];

    reinforcements: string[];

    repeatedStructures: string[];

    linkedPlanets: string[];

    axisConnections: string[];

    dispositorChain: string[];

    symbolicFlags: string[];
  };
}

interface BuildPlanetaryStateInput {

  planets: PlanetPosition[];

  placements: PlanetHousePlacement[];

  dignities: PlanetDignity[];

  functionalRoles: FunctionalRole[];

  reinforcementGraph: ReinforcementNode[];

  axisActivations: AxisActivation[];

  dispositorChains: DispositorChain[];
}

export function buildPlanetaryState({

  planets,

  placements,

  dignities,

  functionalRoles,

  reinforcementGraph,

  axisActivations,

  dispositorChains

}: BuildPlanetaryStateInput):

  PlanetaryState[] {

  return planets.map(
    (planet) => {

      const placement =
        placements.find(
          (p) =>
            p.planet ===
            planet.planet
        );

      const dignity =
        dignities.find(
          (d) =>
            d.planet ===
            planet.planet
        );

      const role =
        functionalRoles.find(
          (r) =>
            r.planet ===
            planet.planet
        );

      const reinforcement =
        reinforcementGraph.find(
          (r) =>
            r.planet ===
            planet.planet
        );

      const chain =
        dispositorChains.find(
          (c) =>
            c.planet ===
            planet.planet
        );

      const connectedAxes =
        axisActivations
          .filter(
            (axis) =>
              axis.activatedBy.includes(
                planet.planet
              )
          )
          .map(
            (axis) =>
              axis.axis
          );

      const symbolicFlags =
        new Set<string>();

      /*
        Retrograde
      */

      if (
        planet.isRetrograde
      ) {

        symbolicFlags.add(
          "RETROGRADE"
        );
      }

      /*
        Closed loop
      */

      if (
        chain?.isClosedLoop
      ) {

        symbolicFlags.add(
          "DISPOSITOR_LOOP"
        );
      }

      /*
        Reinforced
      */

      if (
        reinforcement &&
        reinforcement
          .reinforcementSources
          .length >= 2
      ) {

        symbolicFlags.add(
          "HIGH_REINFORCEMENT"
        );
      }

      return {

        planet:
          planet.planet,

        state: {

          placement: {

            sign:
              placement?.sign || "",

            house:
              placement?.house || 0,

            nakshatra:
              planet.nakshatra,

            retrograde:
              planet.isRetrograde
          },

          dignity:
            dignity?.dignity || [],

          roles:
            role?.roles || [],

          reinforcements:
            reinforcement
              ?.reinforcementSources || [],

          repeatedStructures:
            reinforcement
              ?.repeatedStructures || [],

          linkedPlanets:
            reinforcement
              ?.linkedPlanets || [],

          axisConnections:
            connectedAxes,

          dispositorChain:
            chain
              ?.chain
              .map(
                (step) =>
                  step.lord
              ) || [],

          symbolicFlags:
            Array.from(
              symbolicFlags
            )
        }
      };
    }
  );
}