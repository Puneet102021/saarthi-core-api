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

export function getZodiacSign(
  longitude: number
): string {

  const normalized =
    normalizeDegrees(longitude);

  const signIndex =
    Math.floor(
      normalized / 30
    );

  return ZODIAC_SIGNS[
    signIndex
  ];
}

export function getDegreeInSign(
  longitude: number
): number {

  const normalized =
    normalizeDegrees(longitude);

  return Number(
    (normalized % 30)
    .toFixed(4)
  );
}

export function normalizeDegrees(
  value: number
): number {

  let result =
    value % 360;

  if (result < 0) {
    result += 360;
  }

  return result;
}