export function getPlanet(
  kernel: any,
  planetName: string
) {
  return kernel.placements?.find(
    (p: any) =>
      p.planet === planetName
  );
}

export function getHouseDistance(
  fromHouse: number,
  toHouse: number
) {
  return (
    (toHouse - fromHouse + 12) % 12
  ) + 1;
}

export function areInSameHouse(
  a: any,
  b: any
) {
  return (
    a?.house &&
    b?.house &&
    a.house === b.house
  );
}

export function areInKendraFromEachOther(
  a: any,
  b: any
) {
  if (!a?.house || !b?.house) {
    return false;
  }

  const distance =
    getHouseDistance(
      a.house,
      b.house
    );

  return [1, 4, 7, 10].includes(
    distance
  );
}

export function createNotDetected(
  id: string,
  name: string,
  category: "YOGA" | "DOSHA",
  reason: string
) {
  return {
    id,
    name,
    category,
    detected: false,
    confidence: "LOW" as const,
    participants: [],
    supportingStructures: [],
    notes: [
      reason
    ]
  };
}