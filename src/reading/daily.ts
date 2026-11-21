import { planetIn } from "../astrology/chart";
import { ordinal } from "../astrology/math";
import { positionsAt, transitSnapshot } from "../astrology/transits";
import type { NatalChart } from "../astrology/types";
import type { Evidence, Polarity } from "./evidence";

/*
  Two classical daily indicators, both read from the transiting Moon:
  chandra bala (its sign counted from the natal Moon) and tara bala (its
  nakshatra counted from the birth nakshatra). They set the tone of a day,
  not its events.
*/

const TARAS: { name: string; meaning: string; polarity: Polarity }[] = [
  { name: "Janma", meaning: "the birth star: a sensitive day, better for routine than big starts", polarity: "mixed" },
  { name: "Sampat", meaning: "wealth: good for practical and financial matters", polarity: "supportive" },
  { name: "Vipat", meaning: "obstacles: go carefully and avoid avoidable risks", polarity: "challenging" },
  { name: "Kshema", meaning: "wellbeing: a comfortable, steady day", polarity: "supportive" },
  { name: "Pratyak", meaning: "resistance: things may meet friction; keep plans simple", polarity: "challenging" },
  { name: "Sadhana", meaning: "accomplishment: good for effort and getting things done", polarity: "supportive" },
  { name: "Vadha", meaning: "strain: a day for patience, not confrontation or big decisions", polarity: "challenging" },
  { name: "Mitra", meaning: "friendship: good for people, help and cooperation", polarity: "supportive" },
  { name: "Parama Mitra", meaning: "close friendship: a favourable, supportive day", polarity: "supportive" }
];

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export function taraFor(natalNakshatraIndex: number, transitNakshatraIndex: number) {
  const count = ((transitNakshatraIndex - natalNakshatraIndex + 27) % 27) + 1;
  return { count, ...TARAS[(count - 1) % 9] };
}

/* `date` is the day being read; `label` is how to speak of it ("Today", "Tomorrow"). */
export function dailyEvidence(chart: NatalChart, now: Date, label = "Today"): Evidence[] {
  const day = { start: isoDate(now), end: isoDate(now) };
  const natalMoon = planetIn(chart, "Moon");

  const [moon] = transitSnapshot(chart, now, ["Moon"]);
  const chandrashtama = moon.houseFromMoon === 8;

  const chandraBala: Evidence = {
    id: "",
    key: "daily:chandra-bala",
    domain: "timing",
    kind: "transit",
    title: `${label}'s Moon in ${moon.sign}`,
    statement:
      `${label} the Moon is in ${moon.sign}, ${ordinal(moon.houseFromMoon)} from the natal Moon` +
      (chandrashtama
        ? " (chandrashtama): emotions run closer to the surface; keep the day light and avoid big decisions."
        : moon.favourable
          ? ", a favourable position (chandra bala): the mind is steadier and things flow more easily."
          : ", not a favourable position by chandra bala: a day for patience and routine.") +
      " The Moon changes sign every two to three days.",
    polarity: chandrashtama || !moon.favourable ? "challenging" : "supportive",
    weight: 1,
    timeframe: day
  };

  const transitMoon = positionsAt(now).find((p) => p.planet === "Moon")!;
  const tara = taraFor(natalMoon.nakshatraIndex, transitMoon.nakshatraIndex);

  const taraBala: Evidence = {
    id: "",
    key: "daily:tara-bala",
    domain: "timing",
    kind: "transit",
    title: `${label}'s star: ${transitMoon.nakshatra} (${tara.name} tara)`,
    statement: `${label}'s Moon is in ${transitMoon.nakshatra}, the ${ordinal(tara.count)} nakshatra from the birth star ${natalMoon.nakshatra}: ${tara.name} tara, ${tara.meaning}.`,
    polarity: tara.polarity,
    weight: 0.95,
    timeframe: day
  };

  return [chandraBala, taraBala];
}
