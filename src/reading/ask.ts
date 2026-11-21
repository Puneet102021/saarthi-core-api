import { dashaAt, describePeriod } from "../astrology/dasha";
import type { NatalChart } from "../astrology/types";
import { ChatMessage, jsonCompletion, models } from "../lib/llm";
import { dailyEvidence } from "./daily";
import type { DomainId } from "./domains";
import { natalEvidence } from "./evidence";
import type { Evidence } from "./evidence";
import { classifyQuestion, keywordIntent, Need, QuestionIntent } from "./intent";
import type { PersonProfile } from "./profile";
import { ANSWER_SCHEMA, buildUserMessage, SYSTEM_PROMPT } from "./prompt";
import { rankEvidence } from "./rank";
import { OfferedRemedy, selectRemedies } from "./remedies";
import { timingEvidence } from "./timing";

export interface AskInput {
  chart: NatalChart;
  question: string;
  /* Earlier turns of this conversation, oldest first. */
  history?: ChatMessage[];
  profile?: PersonProfile;
  now?: Date;
  /* Build everything up to the prompt, without calling the model. */
  dryRun?: boolean;
}

export interface AskResult {
  answer: string | null;
  evidenceUsed: string[];
  followUps: string[];
  intent: QuestionIntent;
  need: Need;
  evidence: Evidence[];
  /* The remedies the answer suggests, in full, for the app to show as cards. */
  remedies: OfferedRemedy[];
  /* Everything that was offered to the model; for debugging. */
  remediesOffered: OfferedRemedy[];
  currentPeriod: string | null;
  model: string | null;
  prompt?: { system: string; user: string };
}

/* Shown instead of a reading when a message signals self-harm. */
export const SELF_HARM_RESPONSE = `I'm really sorry you're feeling this way. You don't have to carry it alone, and this is more important than any chart.

Please talk to someone now: in India you can call **Tele-MANAS on 14416** (free, 24 hours) or **KIRAN on 1800-599-0019**. If you are in immediate danger, call **112**. If you are outside India, your local emergency number or a crisis line can help right away.

If you can, reach out to someone you trust and let them know how you're feeling. I'm here to talk whenever you want.`;

/* Keep only citations to evidence and remedies that were offered; the model cannot invent sources. */
export function sanitise(answer: string, ids: Set<string>): string {
  return answer.replace(/\[([ER]\d+(?:\s*,\s*[ER]\d+)*)\]/g, (_, group: string) => {
    const kept = group.split(/\s*,\s*/).filter((id) => ids.has(id));
    return kept.length ? `[${kept.join(", ")}]` : "";
  });
}

const isCurrent = (e: Evidence, now: Date) =>
  !e.timeframe || (Date.parse(e.timeframe.start) <= now.getTime() && Date.parse(e.timeframe.end) >= now.getTime());

/* The chart facts worth reading for this need, before ranking. */
function gatherEvidence(chart: NatalChart, intent: QuestionIntent, now: Date, question: string): Evidence[] {
  const domains = intent.domains;

  switch (intent.need) {
    case "support": {
      /* Place the struggle in a passing period; do not turn it into a reading. */
      const timing = timingEvidence(chart, ["mind"], null, now).filter(
        (e) => e.key.startsWith("dasha:now") || (e.key.startsWith("saturn:") && isCurrent(e, now))
      );
      return [...natalEvidence(chart, ["mind"]), ...timing];
    }

    case "daily": {
      const timing = timingEvidence(chart, domains, null, now).filter(
        (e) => e.key === "dasha:now:2" || e.key === "dasha:now:3"
      );
      /* Keep the birth-time caveat, if any; drop the rest of the natal reading. */
      const caveats = natalEvidence(chart, domains).filter((e) => e.kind === "caveat");
      const tomorrow = /\btomorrow\b/i.test(question);
      const day = tomorrow ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : now;
      return [...caveats, ...dailyEvidence(chart, day, tomorrow ? "Tomorrow" : "Today"), ...timing];
    }

    case "support_guidance": {
      const withMind: DomainId[] = domains.includes("mind") ? domains : [...domains, "mind"];
      return [...natalEvidence(chart, withMind), ...timingEvidence(chart, domains, intent.window, now)];
    }

    default:
      return [...natalEvidence(chart, domains), ...timingEvidence(chart, domains, intent.window, now)];
  }
}

export async function askQuestion(input: AskInput): Promise<AskResult> {
  const now = input.now ?? new Date();
  const history = (input.history ?? []).slice(-8);
  const question = input.question.trim();

  const running = dashaAt(input.chart.dasha.mahadashas, now);
  const currentPeriod = running ? describePeriod(running.pratyantardasha) : null;

  /* The keyword checks for self-harm and distress run even when the model reads the message. */
  const intent = await classifyQuestion(question, history, now, { entryReason: input.profile?.entryReason });
  const keywords = keywordIntent(question, now);
  if (keywords.sensitive === "self_harm") intent.sensitive = "self_harm";
  if (keywords.sensitive === "distress" && intent.sensitive === "none") intent.sensitive = "distress";

  /* A check-in is about the days ahead, not the year. */
  if (intent.need === "daily") {
    const today = now.toISOString().slice(0, 10);
    const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    intent.window = { start: today, end: week };
  }

  if (intent.sensitive === "self_harm") {
    return {
      answer: SELF_HARM_RESPONSE,
      evidenceUsed: [],
      followUps: [],
      intent,
      need: "support",
      evidence: [],
      remedies: [],
      remediesOffered: [],
      currentPeriod,
      model: null
    };
  }

  const evidence = rankEvidence(gatherEvidence(input.chart, intent, now, question), intent);
  const remediesOffered = selectRemedies(input.chart, evidence, intent, now);

  const user = buildUserMessage({
    chart: input.chart,
    question,
    intent,
    evidence,
    remedies: remediesOffered,
    now,
    profile: input.profile
  });

  if (input.dryRun) {
    return {
      answer: null,
      evidenceUsed: [],
      followUps: [],
      intent,
      need: intent.need,
      evidence,
      remedies: [],
      remediesOffered,
      currentPeriod,
      model: null,
      prompt: { system: SYSTEM_PROMPT, user }
    };
  }

  const model = models.answer();

  const result = await jsonCompletion<{
    answer: string;
    evidenceUsed: string[];
    remediesUsed: string[];
    followUps: string[];
  }>({
    model,
    temperature: 0.5,
    maxTokens: 1200,
    schemaName: "saarthi_answer",
    schema: ANSWER_SCHEMA,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history, { role: "user", content: user }]
  });

  const evidenceIds = new Set(evidence.map((e) => e.id));
  const remedyIds = new Set(remediesOffered.map((r) => r.ref));

  return {
    answer: sanitise(result.answer, new Set([...evidenceIds, ...remedyIds])),
    evidenceUsed: result.evidenceUsed.filter((id) => evidenceIds.has(id)),
    followUps: result.followUps.slice(0, 3),
    intent,
    need: intent.need,
    evidence,
    remedies: remediesOffered.filter((r) => result.remediesUsed.includes(r.ref)),
    remediesOffered,
    currentPeriod,
    model
  };
}
