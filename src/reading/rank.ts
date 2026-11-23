import type { Evidence } from "./evidence";
import type { Need, QuestionIntent } from "./intent";

/*
  Keep the strongest evidence within a budget, so the model reads a short,
  relevant brief instead of the whole chart. Saarthi talks like a friend, so
  ordinary replies get only a few facts: enough to say what phase they are
  in and when it shifts. When they ask about the astrology itself, the brief
  opens up: every running period and what comes next.
*/
export interface RankOptions {
  /* The conversation is turning to something new. */
  firstReading?: boolean;
  /* They asked about their chart: explain in depth. */
  deep?: boolean;
}

function budgets(intent: QuestionIntent, { firstReading = false, deep = false }: RankOptions): { natal: number; timing: number } {
  if (intent.need === "daily") return { natal: 0, timing: 5 };

  if (deep) {
    const timingFirst = intent.questionType === "timing" || intent.questionType === "yes_no";
    return timingFirst ? { natal: 7, timing: 13 } : { natal: 8, timing: 9 };
  }

  const light: Partial<Record<Need, { natal: number; timing: number }>> = {
    support: firstReading ? { natal: 2, timing: 4 } : { natal: 2, timing: 2 }
  };
  return light[intent.need] ?? (firstReading ? { natal: 5, timing: 5 } : { natal: 5, timing: 4 });
}

/* The running dasha and what comes next are the spine of a first reading. */
const PERIOD_SPINE = /^(dasha:(now|next):|upcoming:)/;

export function rankEvidence(
  evidence: Evidence[],
  intent: QuestionIntent,
  options: RankOptions = {}
): Evidence[] {
  const { firstReading = false, deep = false } = options;
  const budget = budgets(intent, options);

  /* Making the most of good times: look at what is working first. */
  const score = (e: Evidence) =>
    e.weight *
    (intent.need === "optimise" && e.polarity === "supportive" ? 1.2 : 1) *
    ((firstReading || deep) && PERIOD_SPINE.test(e.key) ? 2 : 1);

  const caveats = evidence.filter((e) => e.kind === "caveat");
  const timing = evidence.filter((e) => e.domain === "timing").sort((a, b) => score(b) - score(a));
  const natal = evidence
    .filter((e) => e.domain !== "timing" && e.kind !== "caveat")
    .sort((a, b) => score(b) - score(a));

  const chosen = [...caveats, ...natal.slice(0, budget.natal), ...timing.slice(0, budget.timing)];

  return chosen.map((e, i) => ({ ...e, id: `E${i + 1}` }));
}
