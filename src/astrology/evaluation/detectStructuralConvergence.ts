export function detectStructuralConvergence(
  kernel: any
) {

  const structures: any[] = [];

  const signClusters =
    kernel.signClusters || [];

  const houseClusters =
    kernel.houseClusters || [];

  const yogas =
    kernel.detectedYogas || [];

  for (
    const signCluster
    of signClusters
  ) {

    const matchingHouseCluster =
      houseClusters.find(
        (house: any) => {

          const overlap =
            house.planets.filter(
              (planet: string) =>
                signCluster.planets.includes(
                  planet
                )
            );

          return overlap.length >= 2;
        }
      );

    if (
      matchingHouseCluster
    ) {

      const participants =
        signCluster.planets;

      const supportingYogas =
        yogas.filter(
          (y: any) =>
            y.participants?.some(
              (p: string) =>
                participants.includes(
                  p
                )
            )
        );

      structures.push({

        id:
          `${matchingHouseCluster.house}_${signCluster.sign}`,

        label:
          `House ${matchingHouseCluster.house} ${signCluster.sign} Concentration`,

        participants,

        supportCount:
          participants.length +
          supportingYogas.length,

        supportingYogas:
          supportingYogas.map(
            (y: any) =>
              y.name
          )
      });
    }
  }

  return structures.sort(
    (a, b) =>
      b.supportCount -
      a.supportCount
  );
}