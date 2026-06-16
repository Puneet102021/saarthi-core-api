export function buildPatternSummary(
  pattern: any
) {

  /*
    Reinforced cluster
  */

  if (
    pattern.type ===
    "REINFORCED_CLUSTER"
  ) {

    return {

      type:
        "reinforced_life_area",

      meaning:
        `Strong concentration of energy around ${pattern.source.sign} and house ${pattern.source.house}.`,

      planets:
        pattern.linkedPlanets
    };
  }

  /*
    Conjunction cluster
  */

  if (
    pattern.type ===
    "CONJUNCTION_CLUSTER"
  ) {

    return {

      type:
        "merged_psychological_drives",

      meaning:
        `Strong fusion between ${pattern.linkedPlanets.join(", ")} influencing personality expression.`,

      planets:
        pattern.linkedPlanets
    };
  }

  /*
    Axis tension
  */

  if (
    pattern.type ===
    "AXIS_TENSION"
  ) {

    return {

      type:
        "internal_polarity",

      meaning:
        `Tension axis involving ${pattern.linkedPlanets.join(" and ")} creating opposing psychological pulls.`,

      planets:
        pattern.linkedPlanets
    };
  }

  /*
    Default
  */

  return {

    type:
      pattern.type,

    meaning:
      "Symbolic reinforcement pattern detected.",

    planets:
      pattern.linkedPlanets || []
  };
}
