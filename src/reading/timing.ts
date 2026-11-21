import { planetIn } from "../astrology/chart";
import { PLANET_SIGNIFICATIONS } from "../astrology/constants";
import { dashaAt, describePeriod, periodsInWindow } from "../astrology/dasha";
import { ordinal } from "../astrology/math";
import { doubleTransits, saturnCycles, transitSegments, transitSnapshot } from "../astrology/transits";
import type { DashaPeriod, NatalChart, PlanetInfo } from "../astrology/types";
import { DOMAINS, DomainId, domainHouses } from "./domains";
import type { Evidence, Polarity } from "./evidence";
import { planetSummary } from "./evidence";

/*
  Timing in the Parashari way: a dasha lord delivers the matters it is tied
  to (the houses it rules, occupies or aspects, and what it signifies), in
  the manner its strength and functional nature allow. Transits of the slow
  planets then show when the ground is ready.
*/

interface Connection {
  score: number;
  reasons: string[];
}

export function connectionTo(p: PlanetInfo, domains: DomainId[]): Connection {
  const { primary, all } = domainHouses(domains);
  const karakas = new Set(domains.flatMap((d) => DOMAINS[d].karakas));

  let score = 0;
  const reasons: string[] = [];

  const ownsPrimary = p.ownsHouses.filter((h) => primary.includes(h));
  const ownsSecondary = p.ownsHouses.filter((h) => all.includes(h) && !primary.includes(h));

  if (ownsPrimary.length) {
    score += 1;
    reasons.push(`rules the ${ownsPrimary.map(ordinal).join(" and ")}`);
  }
  if (primary.includes(p.house)) {
    score += 0.8;
    reasons.push(`sits in the ${ordinal(p.house)}`);
  } else if (all.includes(p.house)) {
    score += 0.4;
    reasons.push(`sits in the ${ordinal(p.house)}`);
  }
  const aspectsPrimary = p.aspectsHouses.filter((h) => primary.includes(h));
  if (aspectsPrimary.length) {
    score += 0.5;
    reasons.push(`aspects the ${aspectsPrimary.map(ordinal).join(" and ")}`);
  }
  if (ownsSecondary.length) {
    score += 0.5;
    reasons.push(`rules the ${ownsSecondary.map(ordinal).join(" and ")}`);
  }
  if (karakas.has(p.planet)) {
    score += 0.4;
    reasons.push("is a natural significator of the matter");
  }

  return { score: Math.min(score, 2), reasons };
}

export function lordPolarity(p: PlanetInfo): Polarity {
  const good = p.functionalNature === "yogakaraka" || p.functionalNature === "benefic";
  const bad = p.functionalNature === "malefic";

  if (good && p.strength.score >= 50) return "supportive";
  if (bad && p.strength.score < 50) return "challenging";
  if (good || p.strength.score >= 60) return "mixed";
  if (bad || p.strength.score < 40) return "challenging";
  return "mixed";
}

function combinePolarity(values: Polarity[]): Polarity {
  const s = values.filter((v) => v === "supportive").length;
  const c = values.filter((v) => v === "challenging").length;
  if (s && !c) return "supportive";
  if (c && !s) return "challenging";
  if (s || c || values.includes("mixed")) return "mixed";
  return "neutral";
}

const fmt = (iso: string) => iso.slice(0, 10);

function lordLine(p: PlanetInfo, connection: Connection): string {
  const tie = connection.reasons.length
    ? `For this question it ${connection.reasons.join(", ")}.`
    : "It has no direct tie to this matter.";
  return `${planetSummary(p)}. ${tie}`;
}

/*
  Life areas of each house, worded for explaining a period to the person.
  (The 8th is about change, never lifespan.)
*/
const LIFE_AREAS: Record<number, string> = {
  1: "self, health and direction",
  2: "family, savings and speech",
  3: "effort, courage and communication",
  4: "home, mother and inner peace",
  5: "creativity, children and learning",
  6: "work routines, health habits and competition",
  7: "partnerships and marriage",
  8: "sudden change, transformation and shared resources",
  9: "fortune, mentors and beliefs",
  10: "career and standing",
  11: "income, gains and friendships",
  12: "expenses, rest, solitude and distant places"
};

/* What a period lord brings in this chart: its natural themes and the houses it rules and sits in. */
export function lordThemes(p: PlanetInfo): string {
  const rules = p.ownsHouses.length
    ? `rules the ${p.ownsHouses.map((h) => `${ordinal(h)} (${LIFE_AREAS[h]})`).join(" and ")}`
    : "rules no house (a node gives the results of its sign lord and the planets with it)";
  return `In this chart ${p.planet} ${rules} and sits in the ${ordinal(p.house)} (${LIFE_AREAS[p.house]}). Its natural themes: ${PLANET_SIGNIFICATIONS[p.planet]}.`;
}

function currentDashaEvidence(chart: NatalChart, domains: DomainId[], now: Date): Evidence[] {
  const running = dashaAt(chart.dasha.mahadashas, now);
  if (!running) return [];

  const levels: [DashaPeriod, string, number][] = [
    [running.mahadasha, "Mahadasha", 0.95],
    [running.antardasha, "Antardasha", 0.9],
    [running.pratyantardasha, "Pratyantardasha", 0.6]
  ];

  return levels.map(([period, name, base]) => {
    const p = planetIn(chart, period.lord);
    const connection = connectionTo(p, domains);

    return {
      id: "",
      key: `dasha:now:${period.level}`,
      domain: "timing" as const,
      kind: "dasha" as const,
      title: `Current ${name}: ${period.lord}`,
      statement: `Running now: ${describePeriod(period)}, ${fmt(period.start)} to ${fmt(period.end)}. ${lordLine(p, connection)} ${lordThemes(p)}`,
      polarity: lordPolarity(p),
      weight: base * Math.max(0.45, Math.min(1, 0.45 + connection.score * 0.4)),
      timeframe: { start: period.start, end: period.end }
    };
  });
}

/*
  What comes next, for first readings: the next pratyantardasha and
  antardasha (and the next mahadasha when it is near), the slow planets'
  next sign changes, and Saturn's hard passages starting or ending. Each
  says when, and what the planet brings in this chart, so the reply can
  explain how the next shifts will feel.
*/
export function upcomingEvidence(chart: NatalChart, domains: DomainId[], now: Date): Evidence[] {
  const YEAR = 365 * 24 * 60 * 60 * 1000;
  const evidence: Evidence[] = [];

  const levels: [1 | 2 | 3, string, number, number][] = [
    [3, "Pratyantardasha", 0.55, 2],
    [2, "Antardasha", 0.75, 4],
    [1, "Mahadasha", 0.85, 6]
  ];

  for (const [level, name, weight, years] of levels) {
    const horizon = new Date(now.getTime() + years * YEAR);
    const next = periodsInWindow(chart.dasha.mahadashas, now, horizon, level).find(
      (period) => Date.parse(period.start) > now.getTime()
    );
    if (!next) continue;

    const p = planetIn(chart, next.lord);
    evidence.push({
      id: "",
      key: `dasha:next:${level}`,
      domain: "timing",
      kind: "dasha",
      title: `Next ${name}: ${next.lord}, from ${fmt(next.start)}`,
      statement: `The current ${name.toLowerCase()} ends on ${fmt(next.start)}; then ${describePeriod(next)} runs ${fmt(next.start)} to ${fmt(next.end)}. ${lordLine(p, connectionTo(p, domains))} ${lordThemes(p)}`,
      polarity: lordPolarity(p),
      weight,
      timeframe: { start: next.start, end: next.end }
    });
  }

  /* The slow planets' next moves over the coming two years. */
  const end = new Date(now.getTime() + 2 * YEAR);
  const segments = transitSegments(chart, now, end, ["Saturn", "Jupiter", "Rahu"]);
  const reference = chart.houseReference === "moon" ? "the Moon sign" : "the ascendant";

  for (const planet of ["Saturn", "Jupiter", "Rahu"] as const) {
    const next = segments.find((s) => s.planet === planet && Date.parse(s.start) > now.getTime());
    if (!next) continue;

    const nodes = planet === "Rahu" ? " (with Ketu opposite)" : "";
    evidence.push({
      id: "",
      key: `upcoming:${planet}:${next.start}`,
      domain: "timing",
      kind: "transit",
      title: `${planet} moves into ${next.sign} on ${fmt(next.start)}`,
      statement:
        `On ${fmt(next.start)} ${planet}${nodes} moves into ${next.sign} until ${fmt(next.end)}: ` +
        `${ordinal(next.houseFromLagna)} from ${reference} (${LIFE_AREAS[next.houseFromLagna]}) and ` +
        `${ordinal(next.houseFromMoon)} from the natal Moon, ${next.favourable ? "a favourable" : "not a favourable"} position by classical gochara. ` +
        `${planet} in transit brings its themes (${PLANET_SIGNIFICATIONS[planet]}) to that area of life.`,
      polarity: next.favourable ? "supportive" : "challenging",
      weight: planet === "Rahu" ? 0.5 : 0.65,
      timeframe: { start: next.start, end: next.end }
    });
  }

  /* Saturn's hard passages: when one ahead begins, or the current one ends. */
  const saturnSegments = transitSegments(chart, new Date(now.getTime() - 3 * YEAR), new Date(now.getTime() + 3 * YEAR), ["Saturn"]);
  for (const cycle of saturnCycles(saturnSegments)) {
    const starts = Date.parse(cycle.start) > now.getTime();
    const ends = !starts && Date.parse(cycle.end) > now.getTime();
    if (!starts && !ends) continue;

    evidence.push({
      id: "",
      key: `upcoming:saturn:${cycle.kind}:${cycle.start}`,
      domain: "timing",
      kind: "transit",
      title: starts ? `${cycle.description} begins ${fmt(cycle.start)}` : `${cycle.description} ends ${fmt(cycle.end)}`,
      statement: starts
        ? `${cycle.description} runs ${fmt(cycle.start)} to ${fmt(cycle.end)}: a stretch of pressure and slower results that rewards patience, structure and steady effort.`
        : `${cycle.description} is running now and ends on ${fmt(cycle.end)}; as it lifts, pressure usually eases and delayed efforts start to move.`,
      polarity: starts ? "challenging" : "mixed",
      weight: cycle.kind === "sade_sati" ? 0.7 : 0.55,
      timeframe: { start: cycle.start, end: cycle.end }
    });
  }

  return evidence;
}

/* The sub-periods in the window most tied to the question, best first. */
function windowDashaEvidence(
  chart: NatalChart,
  domains: DomainId[],
  window: { start: string; end: string },
  now: Date
): Evidence[] {
  const start = new Date(window.start);
  const end = new Date(window.end);
  const months = (end.getTime() - start.getTime()) / (30.44 * 24 * 60 * 60 * 1000);

  /* Short windows are read at pratyantardasha level, longer ones at antardasha. */
  const level = months <= 18 ? 3 : 2;

  const running = dashaAt(chart.dasha.mahadashas, now);
  const runningKey = running ? (level === 3 ? running.pratyantardasha : running.antardasha).start : null;

  const scored = periodsInWindow(chart.dasha.mahadashas, start, end, level)
    .filter((period) => period.start !== runningKey)
    .map((period) => {
      const lords = period.path.map((name) => planetIn(chart, name));
      const connections = lords.map((p) => connectionTo(p, domains));

      /* The sub-period lord decides; the major lord sets the stage. */
      const relevance =
        connections[connections.length - 1].score * 0.6 +
        connections.slice(0, -1).reduce((sum, c) => sum + c.score, 0) * 0.25;

      const polarity = combinePolarity(lords.slice(-2).map(lordPolarity));

      const lines = lords
        .slice(-2)
        .map((p, i) => lordLine(p, connections[connections.length - 2 + i]));

      return {
        period,
        relevance,
        evidence: {
          id: "",
          key: `dasha:${period.path.join("-")}:${period.start}`,
          domain: "timing" as const,
          kind: "dasha" as const,
          title: describePeriod(period),
          statement: `${describePeriod(period)} runs ${fmt(period.start)} to ${fmt(period.end)}. ${lines.join(" ")}`,
          polarity,
          weight: Math.min(0.9, 0.5 + relevance * 0.25),
          timeframe: { start: period.start, end: period.end }
        }
      };
    });

  return scored
    .filter((s) => s.relevance >= 0.5)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5)
    .map((s) => s.evidence);
}

function transitEvidence(
  chart: NatalChart,
  domains: DomainId[],
  window: { start: string; end: string },
  now: Date
): Evidence[] {
  const { primary, all } = domainHouses(domains);
  const evidence: Evidence[] = [];

  const snapshot = transitSnapshot(chart, now, ["Saturn", "Jupiter", "Rahu", "Ketu"]);
  const reference = chart.houseReference === "moon" ? "the Moon sign" : "the ascendant";

  for (const t of snapshot) {
    const touches = all.includes(t.houseFromLagna);
    evidence.push({
      id: "",
      key: `transit:now:${t.planet}`,
      domain: "timing",
      kind: "transit",
      title: `${t.planet} now in ${t.sign}`,
      statement:
        `${t.planet} is transiting ${t.sign}${t.retrograde && t.planet !== "Rahu" && t.planet !== "Ketu" ? " (retrograde)" : ""}: ` +
        `${ordinal(t.houseFromMoon)} from the natal Moon (${t.favourable ? "a favourable" : "not a favourable"} position by classical gochara) ` +
        `and ${ordinal(t.houseFromLagna)} from ${reference}${touches ? ", a house that matters for this question" : ""}.`,
      polarity: t.favourable ? "supportive" : "challenging",
      weight: (t.planet === "Saturn" || t.planet === "Jupiter" ? 0.55 : 0.4) + (touches ? 0.2 : 0)
    });
  }

  const start = new Date(Math.max(Date.parse(window.start), now.getTime() - 30 * 24 * 60 * 60 * 1000));
  const end = new Date(window.end);
  if (end <= start) return evidence;

  const segments = transitSegments(chart, start, end, ["Saturn", "Jupiter", "Rahu", "Ketu"]);

  for (const s of segments) {
    if (Date.parse(s.start) <= now.getTime()) continue;
    if (!all.includes(s.houseFromLagna) && !primary.includes(s.houseFromMoon)) continue;

    evidence.push({
      id: "",
      key: `transit:${s.planet}:${s.start}`,
      domain: "timing",
      kind: "transit",
      title: `${s.planet} enters ${s.sign} on ${fmt(s.start)}`,
      statement:
        `${s.planet} moves into ${s.sign} on ${fmt(s.start)} and stays until ${fmt(s.end)}: ` +
        `${ordinal(s.houseFromLagna)} from ${reference} and ${ordinal(s.houseFromMoon)} from the Moon ` +
        `(${s.favourable ? "favourable" : "not favourable"} from the Moon).`,
      polarity: s.favourable ? "supportive" : "challenging",
      weight: s.planet === "Saturn" || s.planet === "Jupiter" ? 0.6 : 0.45,
      timeframe: { start: s.start, end: s.end }
    });
  }

  for (const cycle of saturnCycles(segments)) {
    if (Date.parse(cycle.end) < now.getTime()) continue;
    evidence.push({
      id: "",
      key: `saturn:${cycle.kind}:${cycle.start}`,
      domain: "timing",
      kind: "transit",
      title: cycle.description,
      statement: `${cycle.description}, ${fmt(cycle.start)} to ${fmt(cycle.end)}. A period of pressure, slower results and responsibility; it rewards patience and steady effort.`,
      polarity: "challenging",
      weight: cycle.kind === "sade_sati" ? 0.7 : 0.55,
      timeframe: { start: cycle.start, end: cycle.end }
    });
  }

  if (chart.birthTimeKnown) {
    for (const w of doubleTransits(chart, segments, primary)) {
      if (Date.parse(w.end) < now.getTime()) continue;
      evidence.push({
        id: "",
        key: `double:${w.house}:${w.start}`,
        domain: "timing",
        kind: "transit",
        title: `Double transit on the ${ordinal(w.house)} house`,
        statement: `Jupiter and Saturn both influence the ${ordinal(w.house)} house from ${fmt(w.start)} to ${fmt(w.end)} (double transit): the house's promise is activated and events tied to it become more likely, provided the dasha supports it.`,
        polarity: "supportive",
        weight: 0.8,
        timeframe: { start: w.start, end: w.end }
      });
    }
  }

  return evidence;
}

export function timingEvidence(
  chart: NatalChart,
  domains: DomainId[],
  window: { start: string; end: string } | null,
  now: Date
): Evidence[] {
  const lookahead = window ?? {
    start: now.toISOString().slice(0, 10),
    end: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  };

  return [
    ...currentDashaEvidence(chart, domains, now),
    ...(window ? windowDashaEvidence(chart, domains, window, now) : []),
    ...transitEvidence(chart, domains, lookahead, now)
  ];
}
