import { Planet, Sign } from "./constants";
import { aspectedHouses } from "./aspects";
import { julianDayUt, planetaryPositions } from "./ephemeris";
import { houseFrom, signAt } from "./math";
import type { NatalChart, PlanetPosition } from "./types";

/*
  Gochara (transits) read the classical way: by sign, counted from the natal
  Moon sign and from the ascendant. Vedha (obstruction) is not applied.
*/

/* Houses from the natal Moon in which a transiting planet gives good results. */
const FAVOURABLE_FROM_MOON: Record<Planet, number[]> = {
  Sun: [3, 6, 10, 11],
  Moon: [1, 3, 6, 7, 10, 11],
  Mars: [3, 6, 11],
  Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11],
  Venus: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  Saturn: [3, 6, 11],
  Rahu: [3, 6, 11],
  Ketu: [3, 6, 11]
};

export const SLOW_PLANETS: Planet[] = ["Saturn", "Jupiter", "Rahu", "Ketu"];

const DAY_MS = 24 * 60 * 60 * 1000;

export function positionsAt(date: Date): PlanetPosition[] {
  return planetaryPositions(julianDayUt(date));
}

function moonSignIndex(chart: NatalChart) {
  return chart.planets.find((p) => p.planet === "Moon")!.signIndex;
}

export interface TransitPlacement {
  planet: Planet;
  sign: Sign;
  degree: number;
  retrograde: boolean;
  houseFromMoon: number;
  houseFromLagna: number;
  favourable: boolean;
}

export function transitSnapshot(
  chart: NatalChart,
  date: Date,
  planets: Planet[] = ["Saturn", "Jupiter", "Rahu", "Ketu", "Mars"]
): TransitPlacement[] {
  const moonIndex = moonSignIndex(chart);

  return positionsAt(date)
    .filter((p) => planets.includes(p.planet))
    .map((p) => {
      const houseFromMoon = houseFrom(moonIndex, p.signIndex);
      return {
        planet: p.planet,
        sign: p.sign,
        degree: p.degree,
        retrograde: p.retrograde,
        houseFromMoon,
        houseFromLagna: houseFrom(chart.houseOneSignIndex, p.signIndex),
        favourable: FAVOURABLE_FROM_MOON[p.planet].includes(houseFromMoon)
      };
    });
}

export interface TransitSegment {
  planet: Planet;
  sign: Sign;
  start: string;
  end: string;
  houseFromMoon: number;
  houseFromLagna: number;
  favourable: boolean;
}

function signIndexAt(planet: Planet, time: number): number {
  return positionsAt(new Date(time)).find((p) => p.planet === planet)!.signIndex;
}

/* Narrow a sign change between two instants to within a few minutes. */
function findIngress(planet: Planet, from: number, to: number): number {
  const startSign = signIndexAt(planet, from);
  let lo = from;
  let hi = to;

  while (hi - lo > 5 * 60 * 1000) {
    const mid = (lo + hi) / 2;
    if (signIndexAt(planet, mid) === startSign) lo = mid;
    else hi = mid;
  }

  return hi;
}

/*
  Sign-by-sign periods of each planet across [start, end). Retrograde
  re-entries come out as separate segments, as they should.
*/
export function transitSegments(
  chart: NatalChart,
  start: Date,
  end: Date,
  planets: Planet[] = SLOW_PLANETS,
  stepDays = 3
): TransitSegment[] {
  const moonIndex = moonSignIndex(chart);
  const step = stepDays * DAY_MS;
  const segments: TransitSegment[] = [];

  for (const planet of planets) {
    let segmentStart = start.getTime();
    let currentSign = signIndexAt(planet, segmentStart);
    let previous = segmentStart;

    const close = (until: number) => {
      const houseFromMoon = houseFrom(moonIndex, currentSign);
      segments.push({
        planet,
        sign: signAt(currentSign),
        start: new Date(segmentStart).toISOString(),
        end: new Date(until).toISOString(),
        houseFromMoon,
        houseFromLagna: houseFrom(chart.houseOneSignIndex, currentSign),
        favourable: FAVOURABLE_FROM_MOON[planet].includes(houseFromMoon)
      });
    };

    for (let t = segmentStart + step; ; t += step) {
      const time = Math.min(t, end.getTime());
      const sign = signIndexAt(planet, time);

      if (sign !== currentSign) {
        const ingress = findIngress(planet, previous, time);
        close(ingress);
        segmentStart = ingress;
        currentSign = sign;
      }

      previous = time;
      if (time >= end.getTime()) break;
    }

    close(end.getTime());
  }

  return segments.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

export type SadeSatiPhase = "rising" | "peak" | "setting";

export interface SaturnCycle {
  kind: "sade_sati" | "kantaka_shani" | "ashtama_shani";
  phase?: SadeSatiPhase;
  start: string;
  end: string;
  description: string;
}

/*
  Saturn's hard passages over the natal Moon: Sade Sati (12th, 1st and 2nd
  from the Moon, about seven and a half years) and the two Dhaiyas (4th:
  Kantaka Shani; 8th: Ashtama Shani, about two and a half years each).
*/
export function saturnCycles(segments: TransitSegment[]): SaturnCycle[] {
  const pieces = segments
    .filter((s) => s.planet === "Saturn")
    .flatMap((s): SaturnCycle[] => {
      switch (s.houseFromMoon) {
        case 12:
          return [{ kind: "sade_sati", phase: "rising", start: s.start, end: s.end, description: "Sade Sati, rising phase (Saturn in the 12th from the Moon)" }];
        case 1:
          return [{ kind: "sade_sati", phase: "peak", start: s.start, end: s.end, description: "Sade Sati, peak phase (Saturn over the natal Moon sign)" }];
        case 2:
          return [{ kind: "sade_sati", phase: "setting", start: s.start, end: s.end, description: "Sade Sati, setting phase (Saturn in the 2nd from the Moon)" }];
        case 4:
          return [{ kind: "kantaka_shani", start: s.start, end: s.end, description: "Kantaka Shani (Saturn in the 4th from the Moon)" }];
        case 8:
          return [{ kind: "ashtama_shani", start: s.start, end: s.end, description: "Ashtama Shani (Saturn in the 8th from the Moon)" }];
        default:
          return [];
      }
    });

  /*
    Saturn's retrograde loops cut one passage into several pieces. Join
    back-to-back pieces of the same cycle, so Sade Sati reads as one period
    with its phases listed.
  */
  const merged: (SaturnCycle & { phases: { phase: SadeSatiPhase; start: string }[] })[] = [];

  for (const piece of pieces) {
    const last = merged[merged.length - 1];
    /* A retrograde dip back out of the cycle (months, not years) does not end it. */
    const tolerance = piece.kind === "sade_sati" ? 300 * DAY_MS : DAY_MS;
    const touching = last && Date.parse(piece.start) - Date.parse(last.end) < tolerance;

    if (last && touching && last.kind === piece.kind) {
      last.end = piece.end;
      if (piece.phase && last.phases[last.phases.length - 1]?.phase !== piece.phase) {
        last.phases.push({ phase: piece.phase, start: piece.start });
      }
    } else {
      merged.push({ ...piece, phases: piece.phase ? [{ phase: piece.phase, start: piece.start }] : [] });
    }
  }

  return merged.map(({ phases, ...cycle }) =>
    cycle.kind === "sade_sati"
      ? {
          ...cycle,
          phase: phases[phases.length - 1]?.phase,
          description: `Sade Sati (Saturn passing the 12th, 1st and 2nd from the Moon); phases in this span: ${phases
            .map((p) => `${p.phase} from ${p.start.slice(0, 10)}`)
            .join(", ")}`
        }
      : cycle
  );
}

export interface DoubleTransitWindow {
  house: number;
  start: string;
  end: string;
}

/*
  Double transit: Jupiter and Saturn both occupying or aspecting a house
  (from the ascendant) at once. A widely used timing rule for when a house's
  promise is likely to deliver; it shows readiness, not a guarantee.
*/
export function doubleTransits(
  chart: NatalChart,
  segments: TransitSegment[],
  houses: number[]
): DoubleTransitWindow[] {
  const touches = (planet: Planet, fromLagna: number, house: number) =>
    fromLagna === house || aspectedHouses(planet, fromLagna).includes(house);

  const jupiter = segments.filter((s) => s.planet === "Jupiter");
  const saturn = segments.filter((s) => s.planet === "Saturn");

  const windows: DoubleTransitWindow[] = [];

  for (const house of houses) {
    for (const j of jupiter) {
      if (!touches("Jupiter", j.houseFromLagna, house)) continue;

      for (const s of saturn) {
        if (!touches("Saturn", s.houseFromLagna, house)) continue;

        const start = Math.max(Date.parse(j.start), Date.parse(s.start));
        const end = Math.min(Date.parse(j.end), Date.parse(s.end));
        if (end <= start) continue;

        windows.push({ house, start: new Date(start).toISOString(), end: new Date(end).toISOString() });
      }
    }
  }

  /* Merge back-to-back windows for the same house. */
  windows.sort((a, b) => a.house - b.house || Date.parse(a.start) - Date.parse(b.start));

  const merged: DoubleTransitWindow[] = [];
  for (const w of windows) {
    const last = merged[merged.length - 1];
    if (last && last.house === w.house && Date.parse(w.start) - Date.parse(last.end) < DAY_MS) {
      last.end = new Date(Math.max(Date.parse(last.end), Date.parse(w.end))).toISOString();
    } else {
      merged.push({ ...w });
    }
  }

  return merged;
}
