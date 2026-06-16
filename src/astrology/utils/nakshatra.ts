import {
  normalizeDegrees
} from "./zodiac";

const NAKSHATRAS = [

  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati"
];

const NAKSHATRA_SIZE =
  13.3333333333;

const PADA_SIZE =
  3.3333333333;

export interface NakshatraResult {

  name: string;

  pada: number;
}

export function getNakshatra(
  longitude: number
): NakshatraResult {

  const normalized =
    normalizeDegrees(
      longitude
    );

  const nakshatraIndex =
    Math.floor(
      normalized /
      NAKSHATRA_SIZE
    );

  const nakshatraDegree =
    normalized %
    NAKSHATRA_SIZE;

  const pada =
    Math.floor(
      nakshatraDegree /
      PADA_SIZE
    ) + 1;

  return {

    name:
      NAKSHATRAS[
        nakshatraIndex
      ],

    pada
  };
}