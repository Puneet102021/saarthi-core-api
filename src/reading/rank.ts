import type { Evidence } from "./evidence";
import type { Need, QuestionIntent } from "./intent";

/*
  Keep the strongest evidence within a budget, so the model reads a short,
  relevant brief instead of the whole chart. The budget follows the need:
  a person venting gets a few facts that place the struggle in time, a daily
  check-in gets the day, timing questions get more timing evidence.
*/
function budgets(intent: QuestionIntent): { natal: number; timing: number } {
  const byNeed: Partial<Record<Need, { natal: number; timing: number }>> = {
    support: { natal: 3, timing: 3 },
    daily: { natal: 0, timing: 5 }
  };

  const fixed = byNeed[intent.need];
  if (fixed) return fixed;

  const timingFirst = intent.questionType === "timing" || intent.questionType === "yes_no";
  return timingFirst ? { natal: 7, timing: 9 } : { natal: 10, timing: 5 };
}

export function rankEvidence(evidence: Evidence[], intent: QuestionIntent): Evidence[] {
  const budget = budgets(intent);

  /* Making the most of good times: look at what is working first. */
  const score = (e: Evidence) =>
    e.weight * (intent.need === "optimise" && e.polarity === "supportive" ? 1.2 : 1);

  const caveats = evidence.filter((e) => e.kind === "caveat");
  const timing = evidence.filter((e) => e.domain === "timing").sort((a, b) => score(b) - score(a));
  const natal = evidence
    .filter((e) => e.domain !== "timing" && e.kind !== "caveat")
    .sort((a, b) => score(b) - score(a));

  const chosen = [...caveats, ...natal.slice(0, budget.natal), ...timing.slice(0, budget.timing)];

  return chosen.map((e, i) => ({ ...e, id: `E${i + 1}` }));
}
