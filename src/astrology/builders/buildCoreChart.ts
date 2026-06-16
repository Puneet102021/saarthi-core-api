const ZODIAC_SIGNS = [

  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces"
];

export interface House {

  house: number;

  sign: string;
}

export function buildHouses(
  ascendantSign: string
): House[] {

  const ascendantIndex =
    ZODIAC_SIGNS.indexOf(
      ascendantSign
    );

  if (
    ascendantIndex === -1
  ) {

    throw new Error(
      `Invalid ascendant sign: ${ascendantSign}`
    );
  }

  const houses: House[] = [];

  for (
    let i = 0;
    i < 12;
    i++
  ) {

    const signIndex =
      (ascendantIndex + i) % 12;

    houses.push({

      house: i + 1,

      sign:
        ZODIAC_SIGNS[
          signIndex
        ]
    });
  }

  return houses;
}