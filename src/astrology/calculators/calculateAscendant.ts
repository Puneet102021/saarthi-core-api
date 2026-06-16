import sweph from "sweph";

import {
  getZodiacSign,
  getDegreeInSign
} from "../utils/zodiac";

import {
  getNakshatra
} from "../utils/nakshatra";

const C =
  sweph.constants;

interface AscendantInput {

  julianDay: number;

  latitude: number;

  longitude: number;
}

export interface AscendantResult {

  longitude: number;

  sign: string;

  degreeInSign: number;

  nakshatra: string;

  nakshatraPada: number;
}

export function calculateAscendant(
  input: AscendantInput
): AscendantResult {

  const result =
    sweph.houses(

      input.julianDay,

      input.latitude,

      input.longitude,

      "P"
    );

  const ascendantLongitude =
    result.data.points[0];

  const sign =
    getZodiacSign(
      ascendantLongitude
    );

  const degreeInSign =
    getDegreeInSign(
      ascendantLongitude
    );

  const nakshatra =
    getNakshatra(
      ascendantLongitude
    );

  return {

    longitude:
      ascendantLongitude,

    sign,

    degreeInSign,

    nakshatra:
      nakshatra.name,

    nakshatraPada:
      nakshatra.pada
  };
}