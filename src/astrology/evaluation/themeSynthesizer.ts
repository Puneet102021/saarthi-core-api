export function themeSynthesizer(
  symbolicEvaluation: any
) {

  const patterns: any[] = [];

  const signatures =
    symbolicEvaluation
      ?.chartSignature || [];

  /*
    House 7 Activity
  */

  const house7Evidence =
    signatures.filter(
      (s: string) =>
        s.includes("House 7")
    );

  if (
    house7Evidence.length >= 2
  ) {

    patterns.push({

      id:
        "REPEATED_HOUSE_7_ACTIVITY",

      evidence:
        [...new Set(
          house7Evidence
        )]
    });
  }

  /*
    House 5 Activity
  */

  const house5Evidence =
    signatures.filter(
      (s: string) =>
        s.includes("House 5")
    );

  if (
    house5Evidence.length >= 2
  ) {

    patterns.push({

      id:
        "REPEATED_HOUSE_5_ACTIVITY",

      evidence:
        [...new Set(
          house5Evidence
        )]
    });
  }

  /*
    6-8 Axis Activity
  */

  const sixEightEvidence =
    signatures.filter(
      (s: string) =>

        s.includes("House 6") ||

        s.includes("House 8") ||

        s.includes("Vipreet")
    );

  if (
    sixEightEvidence.length >= 2
  ) {

    patterns.push({

      id:
        "REPEATED_6_8_AXIS_ACTIVITY",

      evidence:
        [...new Set(
          sixEightEvidence
        )]
    });
  }

  /*
    Cluster Activity
  */

  const clusterEvidence =
    signatures.filter(
      (s: string) =>
        s.includes("cluster")
    );

  if (
    clusterEvidence.length >= 2
  ) {

    patterns.push({

      id:
        "MULTIPLE_CLUSTER_FORMATIONS",

      evidence:
        [...new Set(
          clusterEvidence
        )]
    });
  }

  /*
    Pressure / Support Activity
  */

  const pressureSupportEvidence =
    symbolicEvaluation
      ?.symbolicSummaries
      ?.flatMap(
        (s: any) =>
          s.themes || []
      )
      ?.filter(
        (t: string) =>

          t.includes(
            "pressure"
          ) ||

          t.includes(
            "support"
          )
      ) || [];

  if (
    pressureSupportEvidence.length >= 2
  ) {

    patterns.push({

      id:
        "REPEATED_PRESSURE_SUPPORT_SIGNALS",

      evidence:
        [...new Set(
          pressureSupportEvidence
        )]
    });
  }

  /*
    Reinforcement Activity
  */

  const reinforcementEvidence =
    symbolicEvaluation
      ?.symbolicSummaries
      ?.flatMap(
        (s: any) =>
          s.themes || []
      )
      ?.filter(
        (t: string) =>
          t.includes(
            "reinforcement"
          )
      ) || [];

  if (
    reinforcementEvidence.length >= 1
  ) {

    patterns.push({

      id:
        "REPEATED_REINFORCEMENT_SIGNALS",

      evidence:
        [...new Set(
          reinforcementEvidence
        )]
    });
  }

  return patterns;
}