/*
  Reference tables for the Vedic (sidereal, Parashari) engine.

  Sources: Brihat Parashara Hora Shastra (BPHS) for dignities, friendships,
  aspects and Vimshottari; Surya Siddhanta orbs for combustion. Where
  traditions disagree, the choice is named in a comment and kept in one place
  so it can be changed without touching the engines.
*/

export const SIGNS = [
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
] as const;

export type Sign = (typeof SIGNS)[number];

export const PLANETS = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu"
] as const;

export type Planet = (typeof PLANETS)[number];

/* The seven visible planets: the only ones with sign rulership and dignity. */
export const SEVEN_PLANETS: Planet[] = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn"
];

export const SIGN_LORDS: Record<Sign, Planet> = {
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

export const NAKSHATRAS = [
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
] as const;

export const NAKSHATRA_SPAN = 360 / 27;

export const PADA_SPAN = NAKSHATRA_SPAN / 4;

/* Vimshottari order, starting from the lord of Ashwini. */
export const DASHA_SEQUENCE: Planet[] = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury"
];

export const DASHA_YEARS: Record<Planet, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17
};

/*
  Length of a dasha year in days. 365.25 (Julian year) is the most common
  choice in Indian software; some use 365.2425 or 360. The difference is a
  few days per decade.
*/
export const DASHA_YEAR_DAYS = 365.25;

/* Exaltation sign and the degree of deepest exaltation (BPHS). */
export const EXALTATION: Partial<Record<Planet, { sign: Sign; degree: number }>> = {
  Sun: { sign: "Aries", degree: 10 },
  Moon: { sign: "Taurus", degree: 3 },
  Mars: { sign: "Capricorn", degree: 28 },
  Mercury: { sign: "Virgo", degree: 15 },
  Jupiter: { sign: "Cancer", degree: 5 },
  Venus: { sign: "Pisces", degree: 27 },
  Saturn: { sign: "Libra", degree: 20 }
};

/* Moolatrikona sign and degree range [from, to) (BPHS). */
export const MOOLATRIKONA: Partial<Record<Planet, { sign: Sign; from: number; to: number }>> = {
  Sun: { sign: "Leo", from: 0, to: 20 },
  Moon: { sign: "Taurus", from: 3, to: 30 },
  Mars: { sign: "Aries", from: 0, to: 12 },
  Mercury: { sign: "Virgo", from: 15, to: 20 },
  Jupiter: { sign: "Sagittarius", from: 0, to: 10 },
  Venus: { sign: "Libra", from: 0, to: 15 },
  Saturn: { sign: "Aquarius", from: 0, to: 20 }
};

/* Natural (naisargika) friendships, BPHS. Anything not listed is neutral. */
export const NATURAL_FRIENDS: Partial<Record<Planet, Planet[]>> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"]
};

export const NATURAL_ENEMIES: Partial<Record<Planet, Planet[]>> = {
  Sun: ["Venus", "Saturn"],
  Moon: [],
  Mars: ["Mercury"],
  Mercury: ["Moon"],
  Jupiter: ["Mercury", "Venus"],
  Venus: ["Sun", "Moon"],
  Saturn: ["Sun", "Moon", "Mars"]
};

/*
  Combustion orbs in degrees from the Sun (Surya Siddhanta). Mercury and
  Venus have smaller orbs when retrograde.
*/
export const COMBUSTION_ORBS: Partial<Record<Planet, { direct: number; retrograde: number }>> = {
  Moon: { direct: 12, retrograde: 12 },
  Mars: { direct: 17, retrograde: 17 },
  Mercury: { direct: 14, retrograde: 12 },
  Jupiter: { direct: 11, retrograde: 11 },
  Venus: { direct: 10, retrograde: 8 },
  Saturn: { direct: 15, retrograde: 15 }
};

/*
  Graha drishti: houses counted from the planet (the planet's own house is 1).
  Every planet aspects the 7th. Rahu and Ketu taking the 5th and 9th like
  Jupiter is common modern practice, not universal.
*/
export const SPECIAL_ASPECTS: Record<Planet, number[]> = {
  Sun: [7],
  Moon: [7],
  Mercury: [7],
  Venus: [7],
  Mars: [4, 7, 8],
  Jupiter: [5, 7, 9],
  Saturn: [3, 7, 10],
  Rahu: [5, 7, 9],
  Ketu: [5, 7, 9]
};

/* Directional strength (dig bala): the house where each planet is strongest. */
export const DIG_BALA_HOUSE: Partial<Record<Planet, number>> = {
  Sun: 10,
  Mars: 10,
  Jupiter: 1,
  Mercury: 1,
  Moon: 4,
  Venus: 4,
  Saturn: 7
};

export const KENDRA = [1, 4, 7, 10];

export const TRIKONA = [1, 5, 9];

export const DUSTHANA = [6, 8, 12];

export const UPACHAYA = [3, 6, 10, 11];

export const HOUSE_SIGNIFICATIONS: Record<number, string> = {
  1: "self, body, vitality, overall direction",
  2: "family, accumulated wealth, speech, food",
  3: "courage, effort, siblings, communication, short travel",
  4: "home, mother, property, vehicles, inner peace, schooling",
  5: "children, intelligence, creativity, romance, past merit",
  6: "work routines, service, competition, debts, illness, disputes",
  7: "marriage, spouse, partnerships, contracts, public dealings",
  8: "longevity, sudden events, transformation, shared resources, research",
  9: "fortune, father, teachers, higher learning, dharma, long travel",
  10: "career, status, authority, public action",
  11: "gains, income, networks, fulfilment of desires, elder siblings",
  12: "expenses, losses, foreign lands, isolation, sleep, liberation"
};

export const PLANET_SIGNIFICATIONS: Record<Planet, string> = {
  Sun: "authority, father, government, vitality, self-confidence",
  Moon: "mind, emotions, mother, public, nourishment",
  Mars: "energy, courage, siblings, land, conflict, surgery",
  Mercury: "intellect, communication, commerce, analysis, skills",
  Jupiter: "wisdom, teachers, children, wealth, guidance, husband (for women)",
  Venus: "love, spouse, comfort, art, luxury, vehicles",
  Saturn: "discipline, delay, labour, longevity, chronic matters, service",
  Rahu: "ambition, foreign things, unconventional paths, obsession, sudden gain",
  Ketu: "detachment, spirituality, loss, research, past-life skill"
};
