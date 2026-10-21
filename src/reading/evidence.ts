import { HOUSE_SIGNIFICATIONS, PLANET_SIGNIFICATIONS, Planet } from "../astrology/constants";
import { DIGNITY_LABEL, vargaDignity } from "../astrology/dignity";
import { planetIn } from "../astrology/chart";
import { ordinal } from "../astrology/math";
import type { NatalChart, PlanetInfo, YogaResult } from "../astrology/types";
import { DOMAINS, DomainId, Varga } from "./domains";

export type Polarity = "supportive" | "challenging" | "mixed" | "neutral";

export interface Evidence {
  /* Assigned after ranking: E1, E2, ... */
  id: string;
  key: string;
  domain: DomainId | "timing";
  kind: "house" | "lord" | "karaka" | "varga" | "yoga" | "dosha" | "dasha" | "transit" | "caveat";
  title: string;
  statement: string;
  polarity: Polarity;
  /* 0-1: how much this should count for the question. */
  weight: number;
  timeframe?: { start: string; end: string };
}

function polarityFromScore(score: number): Polarity {
  if (score >= 60) return "supportive";
  if (score <= 40) return "challenging";
  return "mixed";
}

const FUNCTIONAL_LABEL: Record<PlanetInfo["functionalNature"], string> = {
  yogakaraka: "a yogakaraka (best planet) for this chart",
  benefic: "a functional benefic for this chart",
  neutral: "functionally neutral for this chart",
  malefic: "a functional malefic for this chart"
};

export function planetSummary(p: PlanetInfo): string {
  const parts = [
    `${p.planet} in ${p.sign} (${p.nakshatra}), ${ordinal(p.house)} house`,
    p.dignity ? DIGNITY_LABEL[p.dignity] : null,
    p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? "retrograde" : null,
    p.combust ? "combust" : null,
    p.vargottama ? "vargottama" : null,
    `strength ${p.strength.score}/100 (${p.strength.label})`,
    FUNCTIONAL_LABEL[p.functionalNature]
  ];
  return parts.filter(Boolean).join(", ");
}

function topReasons(p: PlanetInfo, count = 3): string {
  const sorted = [...p.strength.reasons].sort(
    (a, b) => Math.abs(parseFloat(b)) - Math.abs(parseFloat(a))
  );
  return sorted.slice(0, count).map((r) => r.replace(/^[+-]?\d+(\.\d+)? /, "")).join("; ");
}

function houseEvidence(chart: NatalChart, domain: DomainId, house: number, weight: number): Evidence {
  const h = chart.houses[house - 1];

  const influences = [
    h.occupants.length ? `occupied by ${h.occupants.join(", ")}` : "unoccupied",
    h.aspectedBy.length ? `aspected by ${h.aspectedBy.join(", ")}` : null
  ].filter(Boolean);

  return {
    id: "",
    key: `house:${house}`,
    domain,
    kind: "house",
    title: `${ordinal(house)} house (${HOUSE_SIGNIFICATIONS[house]})`,
    statement:
      `${ordinal(house)} house in ${h.sign}, ${influences.join(", ")}; overall ${h.label} (${h.score}/100). ` +
      `Main reasons: ${h.notes.slice(0, 4).join("; ")}.`,
    polarity: polarityFromScore(h.score),
    weight
  };
}

function lordEvidence(chart: NatalChart, domain: DomainId, house: number, weight: number): Evidence {
  const h = chart.houses[house - 1];
  const lord = planetIn(chart, h.lord);

  return {
    id: "",
    key: `lord:${house}`,
    domain,
    kind: "lord",
    title: `${lord.planet}, ruler of the ${ordinal(house)}`,
    statement:
      `${planetSummary(lord)}. It rules the ${ordinal(house)} and sits ${ordinal(h.lordFromHouse)} from it. ` +
      `Strength comes from: ${topReasons(lord)}.`,
    polarity: polarityFromScore(lord.strength.score),
    weight
  };
}

function karakaEvidence(chart: NatalChart, domain: DomainId, planet: Planet, weight: number): Evidence {
  const p = planetIn(chart, planet);

  return {
    id: "",
    key: `karaka:${planet}`,
    domain,
    kind: "karaka",
    title: `${planet} as natural significator (${PLANET_SIGNIFICATIONS[planet]})`,
    statement: `${planetSummary(p)}. Strength comes from: ${topReasons(p)}.`,
    polarity: polarityFromScore(p.strength.score),
    weight
  };
}

const VARGA_INFO: Record<Varga, { name: string; field: "d9Sign" | "d10Sign" | "d7Sign"; lagna: "d9" | "d10" | "d7" }> = {
  D9: { name: "navamsa (D9)", field: "d9Sign", lagna: "d9" },
  D10: { name: "dashamsa (D10)", field: "d10Sign", lagna: "d10" },
  D7: { name: "saptamsa (D7)", field: "d7Sign", lagna: "d7" }
};

function vargaEvidence(chart: NatalChart, domain: DomainId): Evidence | null {
  const def = DOMAINS[domain];
  if (!def.varga) return null;

  /* Divisional charts change sign every few minutes of birth time. */
  if (!chart.birthTimeKnown) return null;

  const info = VARGA_INFO[def.varga];
  const subjects = [
    ...new Set([chart.houses[def.primaryHouses[0] - 1].lord, ...def.karakas])
  ].map((name) => planetIn(chart, name));

  const lines = subjects.map((p) => {
    const sign = p[info.field];
    const dignity = vargaDignity(p.planet, sign);
    return `${p.planet} in ${sign}${dignity ? ` (${dignity})` : ""}`;
  });

  const dignities = subjects.map((p) => vargaDignity(p.planet, p[info.field]));
  const good = dignities.filter((d) => d === "exalted" || d === "own").length;
  const bad = dignities.filter((d) => d === "debilitated").length;

  return {
    id: "",
    key: `varga:${def.varga}`,
    domain,
    kind: "varga",
    title: `${info.name} for ${def.label}`,
    statement: `${info.name} ascendant ${chart.vargaLagna[info.lagna]}; ${lines.join("; ")}. The divisional chart refines how the promise of the main chart works out.`,
    polarity: good > bad ? "supportive" : bad > good ? "challenging" : "neutral",
    weight: 0.6
  };
}

const YOGA_WEIGHT: Record<YogaResult["strength"], number> = {
  strong: 0.9,
  moderate: 0.7,
  weak: 0.45,
  cancelled: 0.35
};

function yogaEvidence(yoga: YogaResult, domain: DomainId): Evidence {
  const polarity: Polarity =
    yoga.strength === "cancelled" ? "mixed" : yoga.kind === "yoga" ? "supportive" : "challenging";

  const parts = [
    `${yoga.name}: ${yoga.strength === "cancelled" ? "present but cancelled" : `${yoga.strength} ${yoga.kind}`}.`,
    `Formed by: ${yoga.factors.join("; ")}.`,
    yoga.cancellations.length ? `Mitigated by: ${yoga.cancellations.join("; ")}.` : null,
    yoga.modern ? "A popular rather than classical (BPHS) combination; give it less weight." : null
  ];

  return {
    id: "",
    key: `yoga:${yoga.id}`,
    domain,
    kind: yoga.kind,
    title: yoga.name,
    statement: parts.filter(Boolean).join(" "),
    polarity,
    weight: YOGA_WEIGHT[yoga.strength] * (yoga.modern ? 0.7 : 1)
  };
}

/* The birth-chart facts that bear on the question's domains. */
export function natalEvidence(chart: NatalChart, domains: DomainId[]): Evidence[] {
  const evidence: Evidence[] = [];
  const seen = new Set<string>();

  const push = (e: Evidence | null) => {
    if (!e || seen.has(e.key)) return;
    seen.add(e.key);
    evidence.push(e);
  };

  domains.forEach((domain, rank) => {
    const def = DOMAINS[domain];
    /* The first domain named is what the question is mainly about. */
    const focus = rank === 0 ? 1 : 0.8;

    def.primaryHouses.forEach((house, i) => {
      push(houseEvidence(chart, domain, house, (i === 0 ? 1 : 0.85) * focus));
      push(lordEvidence(chart, domain, house, (i === 0 ? 0.95 : 0.8) * focus));
    });

    def.secondaryHouses.slice(0, 2).forEach((house) => {
      push(houseEvidence(chart, domain, house, 0.5 * focus));
    });

    def.karakas.forEach((planet, i) => {
      push(karakaEvidence(chart, domain, planet, (i === 0 ? 0.75 : 0.6) * focus));
    });

    push(vargaEvidence(chart, domain));

    for (const yoga of chart.yogas) {
      const byTag = yoga.domains.includes(domain);
      const byHouse = yoga.houses.some((h) => def.primaryHouses.includes(h));
      if (byTag || (byHouse && yoga.kind === "yoga")) {
        const e = yogaEvidence(yoga, domain);
        /* A yoga named for this very matter (Manglik for marriage) outranks one that only shares a house. */
        e.weight = Math.min(1, e.weight * focus + (byTag ? 0.1 : 0));
        push(e);
      }
    }
  });

  if (!chart.birthTimeKnown) {
    push({
      id: "",
      key: "caveat:birth-time",
      domain: domains[0],
      kind: "caveat",
      title: "Birth time unknown",
      statement:
        "The birth time is unknown, so houses are counted from the Moon sign (Chandra lagna) and divisional charts and ascendant-based yogas are left out. Timing is broad.",
      polarity: "neutral",
      weight: 1
    });
  }

  return evidence;
}
