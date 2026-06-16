import {
  DominantPattern
} from "./detectDominantPatterns";

import {
  DispositorChain
} from "./buildDispositorChains";

import {
  FunctionalRole
} from "./buildFunctionalRoles";

import {
  PlanetHousePlacement
} from "../builders/mapPlanetsToHouses";

export interface ReinforcementNode {

  planet: string;

  reinforcementSources: string[];

  linkedPlanets: string[];

  repeatedStructures: string[];
}

interface BuildReinforcementGraphInput {

  dominantPatterns: DominantPattern[];

  dispositorChains: DispositorChain[];

  functionalRoles: FunctionalRole[];

  placements: PlanetHousePlacement[];
}

export function buildReinforcementGraph({

  dominantPatterns,

  dispositorChains,

  functionalRoles,

  placements

}: BuildReinforcementGraphInput):

  ReinforcementNode[] {

  const graph =
    new Map<
      string,
      ReinforcementNode
    >();

  /*
    Initialize
  */

  for (
    const placement
    of placements
  ) {

    graph.set(

      placement.planet,

      {

        planet:
          placement.planet,

        reinforcementSources: [],

        linkedPlanets: [],

        repeatedStructures: []
      }
    );
  }

  /*
    Dominant patterns
  */

  for (
    const pattern
    of dominantPatterns
  ) {

    for (
      const planet
      of pattern.linkedPlanets
    ) {

      const node =
        graph.get(
          planet
        );

      if (!node) {
        continue;
      }

      node.reinforcementSources.push(
        pattern.type
      );

      node.repeatedStructures.push(
        ...pattern.supportingPatterns
      );

      node.linkedPlanets.push(
        ...pattern.linkedPlanets.filter(
          (p) => p !== planet
        )
      );
    }
  }

  /*
    Dispositor loops
  */

  for (
    const chain
    of dispositorChains
  ) {

    if (
      !chain.isClosedLoop
    ) {
      continue;
    }

    const node =
      graph.get(
        chain.planet
      );

    if (!node) {
      continue;
    }

    node.reinforcementSources.push(
      "DISPOSITOR_LOOP"
    );

    node.linkedPlanets.push(
      chain.terminalPlanet
    );
  }

  /*
    Functional roles
  */

  for (
    const role
    of functionalRoles
  ) {

    const node =
      graph.get(
        role.planet
      );

    if (!node) {
      continue;
    }

    if (
      role.roles.length >= 2
    ) {

      node.reinforcementSources.push(
        "MULTI_ROLE_PLANET"
      );
    }

    node.repeatedStructures.push(
      ...role.roles
    );
  }

  /*
    Cleanup
  */

  return Array.from(
    graph.values()
  ).map(
    (node) => ({

      planet:
        node.planet,

      reinforcementSources:
        Array.from(
          new Set(
            node.reinforcementSources
          )
        ),

      linkedPlanets:
        Array.from(
          new Set(
            node.linkedPlanets
          )
        ),

      repeatedStructures:
        Array.from(
          new Set(
            node.repeatedStructures
          )
        )
    })
  );
}