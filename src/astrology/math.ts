import {
  DASHA_SEQUENCE,
  NAKSHATRAS,
  NAKSHATRA_SPAN,
  PADA_SPAN,
  Planet,
  SIGNS,
  Sign
} from "./constants";

export function norm360(value: number): number {
  const result = value % 360;
  return result < 0 ? result + 360 : result;
}

export function signIndexOf(longitude: number): number {
  return Math.floor(norm360(longitude) / 30) % 12;
}

export function signOf(longitude: number): Sign {
  return SIGNS[signIndexOf(longitude)];
}

export function signAt(index: number): Sign {
  return SIGNS[((index % 12) + 12) % 12];
}

export function indexOfSign(sign: Sign): number {
  return SIGNS.indexOf(sign);
}

export function degreeInSign(longitude: number): number {
  return norm360(longitude) % 30;
}

/* House of `toSign` counted from `fromSign`, inclusive: same sign is 1. */
export function houseFrom(fromSignIndex: number, toSignIndex: number): number {
  return ((toSignIndex - fromSignIndex + 12) % 12) + 1;
}

export function angularDistance(a: number, b: number): number {
  const diff = Math.abs(norm360(a) - norm360(b));
  return Math.min(diff, 360 - diff);
}

export function nakshatraOf(longitude: number): {
  name: string;
  index: number;
  pada: number;
  lord: Planet;
} {
  const lon = norm360(longitude);

  /* min() guards against floating-point landing exactly on 360. */
  const index = Math.min(Math.floor(lon / NAKSHATRA_SPAN), 26);

  const within = lon - index * NAKSHATRA_SPAN;

  const pada = Math.min(Math.floor(within / PADA_SPAN), 3) + 1;

  return {
    name: NAKSHATRAS[index],
    index,
    pada,
    lord: DASHA_SEQUENCE[index % 9]
  };
}

export function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  if (!teen && n % 10 === 1) return `${n}st`;
  if (!teen && n % 10 === 2) return `${n}nd`;
  if (!teen && n % 10 === 3) return `${n}rd`;
  return `${n}th`;
}

export function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function formatDegree(degree: number): string {
  const d = Math.floor(degree);
  const m = Math.floor((degree - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}'`;
}
