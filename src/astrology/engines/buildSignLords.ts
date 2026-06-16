export interface SignLord {

  sign: string;

  lord: string;
}

const SIGN_LORDS:
  Record<string, string> = {

  Aries: "Mars",

  Taurus: "Venus",

  Gemini: "Mercury",

  Cancer: "Moon",

  Leo: "Sun",

  Virgo: "Mercury",

  Libra: "Venus",

  Scorpio: "Mars",

  Sagittarius: "Jupiter",

  Capricorn: "Saturn",

  Aquarius: "Saturn",

  Pisces: "Jupiter"
};

export function buildSignLords():
  SignLord[] {

  return Object.entries(
    SIGN_LORDS
  ).map(

    ([sign, lord]) => ({

      sign,

      lord
    })
  );
}

export function getSignLord(
  sign: string
): string {

  const lord =
    SIGN_LORDS[sign];

  if (!lord) {

    throw new Error(
      `No sign lord found for ${sign}`
    );
  }

  return lord;
}