import { dashaAt, describePeriod } from "../astrology/dasha";
import type { NatalChart } from "../astrology/types";
import { ChatMessage, jsonCompletion, models } from "../lib/llm";
import { natalEvidence } from "./evidence";
import type { Evidence } from "./evidence";
import { classifyQuestion, keywordIntent, QuestionIntent } from "./intent";
import { ANSWER_SCHEMA, buildUserMessage, SYSTEM_PROMPT } from "./prompt";
import { rankEvidence } from "./rank";
import { timingEvidence } from "./timing";

export interface AskInput {
  chart: NatalChart;
  question: string;
  /* Earlier turns of this conversation, oldest first. */
  history?: ChatMessage[];
  name?: string | null;
  now?: Date;
  /* Build everything up to the prompt, without calling the model. */
  dryRun?: boolean;
}

export interface AskResult {
  answer: string | null;
  evidenceUsed: string[];
  followUps: string[];
  intent: QuestionIntent;
  evidence: Evidence[];
  currentPeriod: string | null;
  model: string | null;
  prompt?: { system: string; user: string };
}

/* Shown instead of a reading when a question signals self-harm. */
const SELF_HARM_RESPONSE = `I'm really sorry you're feeling this way. You don't have to carry it alone, and this is more important than any chart.

Please talk to someone now: in India you can call **Tele-MANAS on 14416** (free, 24 hours) or **KIRAN on 1800-599-0019**. If you are in immediate danger, call **112**. If you are outside India, your local emergency number or a crisis line can help right away.

If you can, reach out to someone you trust and let them know how you're feeling. I'm here to talk whenever you want.`;

/* Keep only citations to evidence that exists; the model cannot invent sources. */
function sanitise(answer: string, ids: Set<string>): string {
  return answer.replace(/\[(E\d+(?:\s*,\s*E\d+)*)\]/g, (_, group: string) => {
    const kept = group
      .split(/\s*,\s*/)
      .filter((id) => ids.has(id));
    return kept.length ? `[${kept.join(", ")}]` : "";
  });
}

export async function askQuestion(input: AskInput): Promise<AskResult> {
  const now = input.now ?? new Date();
  const history = (input.history ?? []).slice(-8);
  const question = input.question.trim();

  const running = dashaAt(input.chart.dasha.mahadashas, now);
  const currentPeriod = running ? describePeriod(running.pratyantardasha) : null;

  /* The keyword check for self-harm runs even when the model reads the question. */
  const intent = await classifyQuestion(question, history, now);
  if (keywordIntent(question, now).sensitive === "self_harm") intent.sensitive = "self_harm";

  if (intent.sensitive === "self_harm") {
    return {
      answer: SELF_HARM_RESPONSE,
      evidenceUsed: [],
      followUps: [],
      intent,
      evidence: [],
      currentPeriod,
      model: null
    };
  }

  const evidence = rankEvidence(
    [
      ...natalEvidence(input.chart, intent.domains),
      ...timingEvidence(input.chart, intent.domains, intent.window, now)
    ],
    intent
  );

  const user = buildUserMessage({
    chart: input.chart,
    question,
    intent,
    evidence,
    now,
    name: input.name
  });

  if (input.dryRun) {
    return {
      answer: null,
      evidenceUsed: [],
      followUps: [],
      intent,
      evidence,
      currentPeriod,
      model: null,
      prompt: { system: SYSTEM_PROMPT, user }
    };
  }

  const model = models.answer();

  const result = await jsonCompletion<{ answer: string; evidenceUsed: string[]; followUps: string[] }>({
    model,
    temperature: 0.5,
    maxTokens: 1200,
    schemaName: "saarthi_answer",
    schema: ANSWER_SCHEMA,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: user }
    ]
  });

  const ids = new Set(evidence.map((e) => e.id));

  return {
    answer: sanitise(result.answer, ids),
    evidenceUsed: result.evidenceUsed.filter((id) => ids.has(id)),
    followUps: result.followUps.slice(0, 3),
    intent,
    evidence,
    currentPeriod,
    model
  };
}
