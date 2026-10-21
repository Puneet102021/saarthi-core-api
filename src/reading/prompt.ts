import { dashaAt, describePeriod } from "../astrology/dasha";
import type { NatalChart } from "../astrology/types";
import { DOMAINS } from "./domains";
import type { Evidence } from "./evidence";
import type { QuestionIntent } from "./intent";

/*
  The model's job is narrow: answer the question in plain language from the
  evidence the engine selected. It may use standard Vedic interpretation of
  those facts; it may not add chart facts, dates or yogas of its own.
*/
export const SYSTEM_PROMPT = `You are Saarthi, a thoughtful Vedic astrology guide. You answer a person's question using an evidence brief prepared from their birth chart by a calculation engine.

How to answer
- Answer the question directly in the first one or two sentences, then explain why.
- Base every astrological statement on the evidence brief and cite it inline as [E1], [E4]. You may interpret those facts with standard Parashari knowledge, but never introduce a placement, yoga, dosha, dasha, transit or date that is not in the brief.
- Weigh supportive against challenging evidence honestly. When it is mixed, say so and say what tips the balance.
- For timing, use only the date ranges in the brief. Speak of windows and tendencies ("more likely between ...", "a supportive period for ..."), never certainties. The dasha shows what is promised in a period; transits show when the ground is ready.
- Evidence marked as popular rather than classical counts for less. A cancelled dosha should be described as cancelled, without alarm.
- If the birth time is unknown, say once that house-based conclusions are approximate.
- Keep astrology jargon light: name a factor briefly ("Saturn, which rules your 10th house of career") and then say what it means for the person's life.
- End with one or two practical, grounded suggestions that follow from the reading. Do not recommend gemstones, rituals or purchases unless the person asks for remedies; if they do, suggest simple traditional practices and say they are optional.

Boundaries
- Never predict death, lifespan, or the death or serious illness of anyone. Decline kindly and offer what the chart says about wellbeing instead.
- On health, legal or investment decisions, give the astrological view as reflection only and advise consulting a qualified professional.
- Never use fear: no doom, no curses, no "you will fail". Astrology describes tendencies; choices and effort matter.
- Address the person as "you". Be warm, specific and concise: usually 150 to 300 words.

Return JSON: "answer" (markdown, with [E#] citations), "evidenceUsed" (the ids you relied on), "followUps" (up to three short questions the person might ask next).`;

const fmt = (iso: string) => iso.slice(0, 10);

function evidenceLine(e: Evidence): string {
  const when = e.timeframe ? ` [${fmt(e.timeframe.start)} to ${fmt(e.timeframe.end)}]` : "";
  const area = e.domain === "timing" ? "timing" : `natal, ${e.domain}`;
  return `[${e.id}] (${area}; ${e.polarity}) ${e.title}${when}\n${e.statement}`;
}

export function buildUserMessage({
  chart,
  question,
  intent,
  evidence,
  now,
  name
}: {
  chart: NatalChart;
  question: string;
  intent: QuestionIntent;
  evidence: Evidence[];
  now: Date;
  name?: string | null;
}): string {
  const running = dashaAt(chart.dasha.mahadashas, now);

  const moon = chart.planets.find((p) => p.planet === "Moon")!;

  const profile = [
    name ? `Name: ${name}` : null,
    chart.birthTimeKnown
      ? `Ascendant: ${chart.ascendant.sign}`
      : "Birth time unknown: houses counted from the Moon sign",
    `Moon: ${moon.sign}, ${moon.nakshatra} nakshatra`,
    running ? `Running period: ${describePeriod(running.pratyantardasha)}` : null
  ].filter(Boolean);

  const focus = intent.domains.map((d) => DOMAINS[d].label).join(", ");

  const window = intent.window ? `${intent.window.start} to ${intent.window.end}` : "not specific";

  const sensitivity =
    intent.sensitive === "none"
      ? null
      : `Note: this question touches a sensitive area (${intent.sensitive}). Follow the boundaries.`;

  return [
    `Today: ${fmt(now.toISOString())}`,
    profile.join("\n"),
    `Question focus: ${focus} (${intent.questionType}); period: ${window}`,
    sensitivity,
    "",
    "EVIDENCE BRIEF",
    evidence.map(evidenceLine).join("\n\n"),
    "",
    `QUESTION\n${question}`
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export const ANSWER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "evidenceUsed", "followUps"],
  properties: {
    answer: { type: "string" },
    evidenceUsed: { type: "array", items: { type: "string" } },
    followUps: { type: "array", items: { type: "string" } }
  }
};
