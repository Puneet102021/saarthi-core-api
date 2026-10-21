import type { Evidence } from "./evidence";
import type { QuestionIntent } from "./intent";

/*
  Keep the strongest evidence within a budget, so the model reads a short,
  relevant brief instead of the whole chart. Timing questions get more
  timing evidence; every answer keeps at least some of both.
*/
export function rankEvidence(evidence: Evidence[], intent: QuestionIntent): Evidence[] {
  const timingFirst = intent.questionType === "timing" || intent.questionType === "yes_no";

  const caveats = evidence.filter((e) => e.kind === "caveat");
  const timing = evidence.filter((e) => e.domain === "timing").sort((a, b) => b.weight - a.weight);
  const natal = evidence
    .filter((e) => e.domain !== "timing" && e.kind !== "caveat")
    .sort((a, b) => b.weight - a.weight);

  const timingBudget = timingFirst ? 9 : 5;
  const natalBudget = timingFirst ? 7 : 10;

  const chosen = [
    ...caveats,
    ...natal.slice(0, natalBudget),
    ...timing.slice(0, timingBudget)
  ];

  return chosen.map((e, i) => ({ ...e, id: `E${i + 1}` }));
}
