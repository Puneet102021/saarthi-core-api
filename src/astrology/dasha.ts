import {
  DASHA_SEQUENCE,
  DASHA_YEARS,
  DASHA_YEAR_DAYS,
  NAKSHATRA_SPAN
} from "./constants";
import { nakshatraOf, norm360, round } from "./math";
import type { DashaPeriod } from "./types";

/*
  Vimshottari dasha. The birth mahadasha belongs to the lord of the Moon's
  nakshatra, and the share of the nakshatra the Moon has already crossed is
  the share of that mahadasha that elapsed before birth. Sub-periods divide
  their parent in proportion to each lord's years, starting with the
  parent's own lord.
*/

const YEAR_MS = DASHA_YEAR_DAYS * 24 * 60 * 60 * 1000;

export function vimshottariAtBirth(moonLongitude: number, birth: Date) {
  const lon = norm360(moonLongitude);
  const nakshatra = nakshatraOf(lon);
  const elapsedFraction = (lon - nakshatra.index * NAKSHATRA_SPAN) / NAKSHATRA_SPAN;

  const lord = nakshatra.lord;
  const years = DASHA_YEARS[lord];

  const firstStart = new Date(birth.getTime() - elapsedFraction * years * YEAR_MS);

  const mahadashas: DashaPeriod[] = [];
  let start = firstStart.getTime();
  const startIndex = DASHA_SEQUENCE.indexOf(lord);

  /* Ten periods: the first one began before birth, so nine would end short of 120 years of life. */
  for (let i = 0; i < 10; i++) {
    const planet = DASHA_SEQUENCE[(startIndex + i) % 9];
    const end = start + DASHA_YEARS[planet] * YEAR_MS;

    mahadashas.push({
      level: 1,
      lord: planet,
      path: [planet],
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      years: DASHA_YEARS[planet]
    });

    start = end;
  }

  return {
    birthNakshatra: nakshatra.name,
    birthLord: lord,
    balanceAtBirthYears: round(years * (1 - elapsedFraction), 4),
    mahadashas
  };
}

export function subPeriods(parent: DashaPeriod): DashaPeriod[] {
  if (parent.level >= 3) return [];

  const startIndex = DASHA_SEQUENCE.indexOf(parent.lord);
  const parentStart = Date.parse(parent.start);
  const parentEnd = Date.parse(parent.end);

  /* Split the parent's actual span (not its rounded years) so boundaries line up exactly. */
  const span = parentEnd - parentStart;
  let start = parentStart;

  return DASHA_SEQUENCE.map((_, i) => {
    const planet = DASHA_SEQUENCE[(startIndex + i) % 9];
    const share = DASHA_YEARS[planet] / 120;
    const end = i === 8 ? parentEnd : start + span * share;
    const years = (span * share) / YEAR_MS;

    const period: DashaPeriod = {
      level: (parent.level + 1) as 2 | 3,
      lord: planet,
      path: [...parent.path, planet],
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      years: round(years, 4)
    };

    start = end;
    return period;
  });
}

function contains(period: DashaPeriod, time: number) {
  return Date.parse(period.start) <= time && time < Date.parse(period.end);
}

/* Mahadasha, antardasha and pratyantardasha running at `date`. */
export function dashaAt(
  mahadashas: DashaPeriod[],
  date: Date
): { mahadasha: DashaPeriod; antardasha: DashaPeriod; pratyantardasha: DashaPeriod } | null {
  const time = date.getTime();

  const mahadasha = mahadashas.find((p) => contains(p, time));
  if (!mahadasha) return null;

  const antardasha = subPeriods(mahadasha).find((p) => contains(p, time)) as DashaPeriod;
  const pratyantardasha = subPeriods(antardasha).find((p) => contains(p, time)) as DashaPeriod;

  return { mahadasha, antardasha, pratyantardasha };
}

/* Every period at `level` that overlaps [start, end). */
export function periodsInWindow(
  mahadashas: DashaPeriod[],
  start: Date,
  end: Date,
  level: 1 | 2 | 3
): DashaPeriod[] {
  const from = start.getTime();
  const to = end.getTime();

  const overlaps = (p: DashaPeriod) => Date.parse(p.start) < to && Date.parse(p.end) > from;

  let current = mahadashas.filter(overlaps);

  for (let depth = 1; depth < level; depth++) {
    current = current.flatMap(subPeriods).filter(overlaps);
  }

  return current;
}

export function describePeriod(period: DashaPeriod): string {
  const names = ["Mahadasha", "Antardasha", "Pratyantardasha"];
  return period.path
    .map((planet, i) => `${planet} ${names[i]}`)
    .join(" / ");
}
