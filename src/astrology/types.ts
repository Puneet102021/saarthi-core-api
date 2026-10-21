import type { Planet, Sign } from "./constants";

export interface BirthInput {
  /* Local calendar date at the birth place, YYYY-MM-DD. */
  date: string;

  /* Local clock time, HH:mm or HH:mm:ss. Null when the time is unknown. */
  time: string | null;

  /* IANA zone, e.g. Asia/Kolkata. Historical offsets come from the tz database. */
  timezone?: string;

  /* Explicit offset from UTC in minutes; overrides timezone (e.g. local mean time). */
  utcOffsetMinutes?: number;

  latitude: number;

  longitude: number;
}

export interface PlanetPosition {
  planet: Planet;
  longitude: number;
  latitude: number;
  speed: number;
  sign: Sign;
  signIndex: number;
  degree: number;
  nakshatra: string;
  nakshatraIndex: number;
  nakshatraLord: Planet;
  pada: number;
  retrograde: boolean;
}

export type Dignity =
  | "exalted"
  | "moolatrikona"
  | "own"
  | "great_friend"
  | "friend"
  | "neutral"
  | "enemy"
  | "great_enemy"
  | "debilitated";

export type FunctionalNature =
  | "yogakaraka"
  | "benefic"
  | "neutral"
  | "malefic";

export type StrengthLabel = "strong" | "moderate" | "weak";

export interface Strength {
  /* 0 to 100. Heuristic and explainable, not Shadbala. */
  score: number;
  label: StrengthLabel;
  reasons: string[];
}

export interface PlanetInfo extends PlanetPosition {
  house: number;
  dignity: Dignity | null;
  combust: boolean;
  distanceFromSun: number;
  naturalNature: "benefic" | "malefic";
  functionalNature: FunctionalNature;
  isMaraka: boolean;
  ownsHouses: number[];
  aspectsHouses: number[];
  d9Sign: Sign;
  d10Sign: Sign;
  d7Sign: Sign;
  d9Dignity: Dignity | null;
  vargottama: boolean;
  strength: Strength;
}

export interface HouseInfo {
  house: number;
  sign: Sign;
  lord: Planet;
  lordHouse: number;
  lordFromHouse: number;
  lordDignity: Dignity | null;
  lordStrength: number;
  occupants: Planet[];
  aspectedBy: Planet[];
  beneficInfluences: Planet[];
  maleficInfluences: Planet[];
  score: number;
  label: StrengthLabel;
  notes: string[];
}

export interface AscendantInfo {
  longitude: number;
  sign: Sign;
  signIndex: number;
  degree: number;
  nakshatra: string;
  pada: number;
}

export interface DashaPeriod {
  level: 1 | 2 | 3;
  lord: Planet;
  /* Mahadasha lord, then antardasha lord, then pratyantardasha lord. */
  path: Planet[];
  start: string;
  end: string;
  years: number;
}

export type YogaKind = "yoga" | "dosha";

export type YogaStrength = "strong" | "moderate" | "weak" | "cancelled";

export interface YogaResult {
  id: string;
  name: string;
  kind: YogaKind;
  strength: YogaStrength;
  planets: Planet[];
  houses: number[];
  /* Domains the yoga speaks to; used to pick it for a question. */
  domains: string[];
  factors: string[];
  cancellations: string[];
  /* True for yogas from later or popular tradition rather than BPHS. */
  modern?: boolean;
  /* Counted from the ascendant, so only reliable with a known birth time. */
  dependsOnAscendant: boolean;
}

export interface NatalChart {
  engineVersion: number;
  input: BirthInput;
  birthUtc: string;
  julianDay: number;
  ayanamsa: { name: string; value: number };
  nodeType: "true" | "mean";
  birthTimeKnown: boolean;
  /* What house 1 is: the ascendant, or the Moon sign when the birth time is unknown. */
  houseReference: "ascendant" | "moon";
  /* Always computed; only meaningful when birthTimeKnown. */
  ascendant: AscendantInfo;
  /* Sign index of house 1 (the ascendant, or the Moon sign). */
  houseOneSignIndex: number;
  moonSign: Sign;
  moonPaksha: "shukla" | "krishna";
  planets: PlanetInfo[];
  houses: HouseInfo[];
  vargaLagna: { d9: Sign; d10: Sign; d7: Sign };
  yogas: YogaResult[];
  dasha: {
    birthNakshatra: string;
    birthLord: Planet;
    balanceAtBirthYears: number;
    mahadashas: DashaPeriod[];
  };
}
