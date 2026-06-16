interface ActivationPriorityInput {

  currentMahadasha?: string;

  currentAntardasha?: string;

  transitActivations: any[];

  reinforcementGraph: any[];

  planetaryState: any[];
}

export interface ActivationPriority {

  planet: string;

  prioritySources: string[];

  linkedSystems: string[];

  repeatedStructures: string[];

  symbolicFlags: string[];
}

export function buildActivationPriority({

  currentMahadasha,

  currentAntardasha,

  transitActivations,

  reinforcementGraph,

  planetaryState

}: ActivationPriorityInput):

  ActivationPriority[] {

  const priorityMap =
    new Map<
      string,
      ActivationPriority
    >();

  function ensurePlanet(
    planet: string
  ) {

    if (
      !priorityMap.has(
        planet
      )
    ) {

      priorityMap.set(

        planet,

        {
          planet,

          prioritySources: [],

          linkedSystems: [],

          repeatedStructures: [],

          symbolicFlags: []
        }
      );
    }

    return priorityMap.get(
      planet
    )!;
  }

  /*
    Current Mahadasha
  */

  if (
    currentMahadasha
  ) {

    const entry =
      ensurePlanet(
        currentMahadasha
      );

    entry.prioritySources.push(
      "CURRENT_MAHADASHA"
    );
  }

  /*
    Current Antardasha
  */

  if (
    currentAntardasha
  ) {

    const entry =
      ensurePlanet(
        currentAntardasha
      );

    entry.prioritySources.push(
      "CURRENT_ANTARDASHA"
    );
  }

  /*
    Transit activations
  */

  for (
    const activation
    of transitActivations
  ) {

    const entry =
      ensurePlanet(
        activation.natalPlanet
      );

    entry.prioritySources.push(

      `TRANSIT_${activation.activationType}`
    );

    entry.linkedSystems.push(

      `${activation.transitPlanet}_${activation.aspect}`
    );
  }

  /*
    Reinforcement graph
  */

  for (
    const reinforcement
    of reinforcementGraph
  ) {

    const entry =
      ensurePlanet(
        reinforcement.planet
      );

    for (
      const source
      of reinforcement
        .reinforcementSources
    ) {

      entry.prioritySources.push(
        source
      );
    }

    for (
      const linkedPlanet
      of reinforcement
        .linkedPlanets
    ) {

      entry.linkedSystems.push(
        linkedPlanet
      );
    }

    for (
      const structure
      of reinforcement
        .repeatedStructures
    ) {

      entry.repeatedStructures.push(
        structure
      );
    }
  }

  /*
    Planetary state flags
  */

  for (
    const state
    of planetaryState
  ) {

    const entry =
      ensurePlanet(
        state.planet
      );

    for (
      const flag
      of state.state
        .symbolicFlags
    ) {

      entry.symbolicFlags.push(
        flag
      );
    }
  }

  /*
    Deduplicate
  */

  for (
    const entry
    of priorityMap.values()
  ) {

    entry.prioritySources =
      [
        ...new Set(
          entry.prioritySources
        )
      ];

    entry.linkedSystems =
      [
        ...new Set(
          entry.linkedSystems
        )
      ];

    entry.repeatedStructures =
      [
        ...new Set(
          entry.repeatedStructures
        )
      ];

    entry.symbolicFlags =
      [
        ...new Set(
          entry.symbolicFlags
        )
      ];
  }

  return Array.from(
    priorityMap.values()
  );
}