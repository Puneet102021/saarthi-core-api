import { COMBUSTION_ORBS, Planet, SIGN_LORDS } from "./constants";
import { aspectedHouses, conjunctPlanets, planetsAspecting } from "./aspects";
import { vimshottariAtBirth } from "./dasha";
import { dignityOf, vargaDignity } from "./dignity";
import { ayanamsaAt, ephemerisConfig, julianDayUt, planetaryPositions, siderealAscendant } from "./ephemeris";
import { functionalNature, isMaraka, ownedHouses } from "./functional";
import { buildHouses } from "./houses";
import { angularDistance, degreeInSign, houseFrom, nakshatraOf, norm360, signIndexOf, signOf } from "./math";
import { planetStrength } from "./strength";
import { birthInstant } from "./time";
import type { BirthInput, NatalChart, PlanetInfo, PlanetPosition } from "./types";
import { dashamsaSign, navamsaSign, saptamsaSign } from "./vargas";
import { detectYogas, neechaBhangaFor } from "./yogas";

/* Bump when a change alters chart output, so stored charts are rebuilt. */
export const ENGINE_VERSION = 2;

export type ChartCore = Omit<NatalChart, "yogas">;

function naturalNatureOf(
  position: PlanetPosition,
  moonBrightness: number,
  all: PlanetPosition[]
): "benefic" | "malefic" {
  switch (position.planet) {
    case "Jupiter":
    case "Venus":
      return "benefic";
    case "Moon":
      /* The Moon is benefic from roughly the waxing half-Moon to the waning half-Moon. */
      return moonBrightness >= 90 ? "benefic" : "malefic";
    case "Mercury": {
      const withMalefic = all.some(
        (p) =>
          ["Mars", "Saturn", "Rahu", "Ketu"].includes(p.planet) &&
          p.signIndex === position.signIndex
      );
      return withMalefic ? "malefic" : "benefic";
    }
    default:
      return "malefic";
  }
}

export function buildNatalChart(input: BirthInput): NatalChart {
  const config = ephemerisConfig();
  const { utc, timeKnown } = birthInstant(input);
  const jd = julianDayUt(utc);

  const positions = planetaryPositions(jd, config);
  const ascendantLongitude = siderealAscendant(jd, input.latitude, input.longitude, config);

  const get = (planet: Planet) => positions.find((p) => p.planet === planet) as PlanetPosition;
  const sun = get("Sun");
  const moon = get("Moon");

  /*
    Houses are whole-sign from the ascendant. Without a birth time the
    ascendant is unknown, so houses are counted from the Moon sign instead
    (Chandra lagna), the standard fallback.
  */
  const ascIndex = timeKnown ? signIndexOf(ascendantLongitude) : moon.signIndex;

  const elongation = norm360(moon.longitude - sun.longitude);
  const moonBrightness = Math.min(elongation, 360 - elongation);

  const signIndexes = Object.fromEntries(positions.map((p) => [p.planet, p.signIndex])) as Record<Planet, number>;
  const owned = ownedHouses(ascIndex);

  const placements = positions.map((p) => ({
    planet: p.planet,
    house: houseFrom(ascIndex, p.signIndex)
  }));

  const natures = Object.fromEntries(
    positions.map((p) => [p.planet, naturalNatureOf(p, moonBrightness, positions)])
  ) as Record<Planet, "benefic" | "malefic">;

  /* First pass: everything except strength, which depends on the rest. */
  const draft = positions.map((p) => {
    const house = houseFrom(ascIndex, p.signIndex);
    const dignity = dignityOf(p.planet, p.sign, p.degree, signIndexes);
    const distanceFromSun = p.planet === "Sun" ? 0 : angularDistance(p.longitude, sun.longitude);
    const orb = COMBUSTION_ORBS[p.planet];
    const combust = Boolean(orb) && distanceFromSun < (p.retrograde ? orb!.retrograde : orb!.direct);

    const d9Sign = navamsaSign(p.longitude);

    const influencers = [
      ...conjunctPlanets(p.planet, placements),
      ...planetsAspecting(house, placements)
    ].filter((other, i, list) => other !== p.planet && list.indexOf(other) === i);

    return {
      ...p,
      house,
      dignity,
      combust,
      distanceFromSun,
      naturalNature: natures[p.planet],
      ownsHouses: owned[p.planet],
      aspectsHouses: aspectedHouses(p.planet, house),
      d9Sign,
      d10Sign: dashamsaSign(p.longitude),
      d7Sign: saptamsaSign(p.longitude),
      d9Dignity: vargaDignity(p.planet, d9Sign),
      vargottama: d9Sign === p.sign,
      beneficInfluences: influencers.filter((x) => natures[x] === "benefic"),
      maleficInfluences: influencers.filter((x) => natures[x] === "malefic")
    };
  });

  const moonIndex = moon.signIndex;

  const strengths = new Map<Planet, PlanetInfo["strength"]>();

  const strengthFor = (d: (typeof draft)[number], dispositorScore?: number) =>
    planetStrength({
      planet: d.planet,
      house: d.house,
      dignity: d.dignity,
      d9Dignity: d.d9Dignity,
      vargottama: d.vargottama,
      combust: d.combust,
      retrograde: d.retrograde,
      naturalNature: d.naturalNature,
      moonElongation: d.planet === "Moon" ? moonBrightness : undefined,
      beneficInfluences: d.beneficInfluences,
      maleficInfluences: d.maleficInfluences,
      dispositorScore,
      debilitationCancelled:
        d.dignity === "debilitated" &&
        neechaBhangaFor(d.planet, draft, moonIndex).length > 0
    });

  for (const d of draft.filter((x) => x.planet !== "Rahu" && x.planet !== "Ketu")) {
    strengths.set(d.planet, strengthFor(d));
  }

  for (const d of draft.filter((x) => x.planet === "Rahu" || x.planet === "Ketu")) {
    const dispositor = SIGN_LORDS[d.sign];
    strengths.set(d.planet, strengthFor(d, strengths.get(dispositor)?.score));
  }

  const planets: PlanetInfo[] = draft.map((d) => {
    const { beneficInfluences, maleficInfluences, ...rest } = d;

    /* The nodes give the results of their sign lord. */
    const nature =
      d.planet === "Rahu" || d.planet === "Ketu"
        ? functionalNature(SIGN_LORDS[d.sign], owned[SIGN_LORDS[d.sign]])
        : functionalNature(d.planet, d.ownsHouses);

    return {
      ...rest,
      functionalNature: nature,
      isMaraka: isMaraka(d.ownsHouses),
      strength: strengths.get(d.planet) as PlanetInfo["strength"]
    };
  });

  const ascNakshatra = nakshatraOf(ascendantLongitude);

  const core: ChartCore = {
    engineVersion: ENGINE_VERSION,
    input,
    birthUtc: utc.toISOString(),
    julianDay: jd,
    ayanamsa: ayanamsaAt(jd, config),
    nodeType: config.nodeType,
    birthTimeKnown: timeKnown,
    houseReference: timeKnown ? "ascendant" : "moon",
    ascendant: {
      longitude: ascendantLongitude,
      sign: signOf(ascendantLongitude),
      signIndex: signIndexOf(ascendantLongitude),
      degree: degreeInSign(ascendantLongitude),
      nakshatra: ascNakshatra.name,
      pada: ascNakshatra.pada
    },
    houseOneSignIndex: ascIndex,
    moonSign: moon.sign,
    moonPaksha: elongation < 180 ? "shukla" : "krishna",
    planets,
    houses: buildHouses(ascIndex, planets),
    vargaLagna: {
      d9: navamsaSign(ascendantLongitude),
      d10: dashamsaSign(ascendantLongitude),
      d7: saptamsaSign(ascendantLongitude)
    },
    dasha: vimshottariAtBirth(moon.longitude, utc)
  };

  return {
    ...core,
    yogas: detectYogas(core)
  };
}

export function planetIn(chart: { planets: PlanetInfo[] }, planet: Planet): PlanetInfo {
  return chart.planets.find((p) => p.planet === planet) as PlanetInfo;
}
