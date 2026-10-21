import { Sign } from "./constants";
import { degreeInSign, norm360, signAt, signIndexOf } from "./math";

/*
  Divisional charts (Parashari). Sign indexes are 0 = Aries; an index that is
  even (Aries, Gemini, ...) is an odd sign in the traditional count.
*/

const isOddSign = (signIndex: number) => signIndex % 2 === 0;

/* D9 Navamsa: nine parts of 3°20', counted continuously from Aries. */
export function navamsaSign(longitude: number): Sign {
  return signAt(Math.floor(norm360(longitude) / (30 / 9)));
}

/* D10 Dashamsa: odd signs count from the sign itself, even signs from the 9th. */
export function dashamsaSign(longitude: number): Sign {
  const signIndex = signIndexOf(longitude);
  const part = Math.min(Math.floor(degreeInSign(longitude) / 3), 9);
  const start = isOddSign(signIndex) ? signIndex : signIndex + 8;
  return signAt(start + part);
}

/* D7 Saptamsa: odd signs count from the sign itself, even signs from the 7th. */
export function saptamsaSign(longitude: number): Sign {
  const signIndex = signIndexOf(longitude);
  const part = Math.min(Math.floor(degreeInSign(longitude) / (30 / 7)), 6);
  const start = isOddSign(signIndex) ? signIndex : signIndex + 6;
  return signAt(start + part);
}
