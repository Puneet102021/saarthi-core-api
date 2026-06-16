export function buildHouseActivations(
  placements: any[]
) {

  const houseMap:
    Record<number, any> = {};

  for (
    const placement
    of placements
  ) {

    const house =
      placement.house;

    if (
      !houseMap[house]
    ) {

      houseMap[house] = {

        house,

        planets: [],

        activationScore: 0
      };
    }

    houseMap[
      house
    ].planets.push(
      placement.planet
    );

    houseMap[
      house
    ].activationScore += 1;
  }

  return Object.values(
    houseMap
  );
}