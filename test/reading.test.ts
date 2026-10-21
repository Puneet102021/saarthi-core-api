import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildNatalChart } from "../src/astrology/chart";
import { askQuestion } from "../src/reading/ask";
import { keywordIntent } from "../src/reading/intent";

/* These run without a model: no OPENAI_API_KEY means keyword intent and dry runs. */
delete process.env.OPENAI_API_KEY;

const now = new Date("2026-10-21T00:00:00Z");

const chart = buildNatalChart({
  date: "1992-03-14",
  time: "06:45",
  timezone: "Asia/Kolkata",
  latitude: 19.07,
  longitude: 72.88
});

describe("question intent (keywords)", () => {
  it("reads a marriage timing question", () => {
    const intent = keywordIntent("When will I get married?", now);
    assert.deepEqual(intent.domains, ["marriage"]);
    assert.equal(intent.questionType, "timing");
    assert.deepEqual(intent.window, { start: "2026-10-21", end: "2029-10-21" });
  });

  it("resolves 'next year' and flags investment questions", () => {
    const intent = keywordIntent("Should I invest in stocks next year?", now);
    assert.ok(intent.domains.includes("wealth"));
    assert.equal(intent.sensitive, "financial");
    assert.deepEqual(intent.window, { start: "2027-01-01", end: "2027-12-31" });
  });

  it("flags self-harm", () => {
    assert.equal(keywordIntent("I want to end my life", now).sensitive, "self_harm");
  });
});

describe("askQuestion (dry run)", () => {
  it("builds a cited evidence brief for the question", async () => {
    const result = await askQuestion({ chart, question: "When will I get a promotion at work?", now, dryRun: true });

    assert.equal(result.answer, null);
    assert.deepEqual(result.intent.domains, ["career"]);
    assert.ok(result.evidence.length >= 8 && result.evidence.length <= 17, `${result.evidence.length} items`);
    assert.ok(result.evidence.some((e) => e.key === "house:10"), "10th house evidence");
    assert.ok(result.evidence.some((e) => e.key === "lord:10"), "10th lord evidence");
    assert.ok(result.evidence.some((e) => e.kind === "dasha"), "dasha evidence");
    assert.deepEqual(
      result.evidence.map((e) => e.id),
      result.evidence.map((_, i) => `E${i + 1}`)
    );
    assert.ok(result.prompt!.user.includes("When will I get a promotion at work?"));
    assert.ok(result.prompt!.user.includes("[E1]"));
  });

  it("answers self-harm with support, not astrology", async () => {
    const result = await askQuestion({ chart, question: "I feel like ending my life", now });
    assert.match(result.answer!, /14416/);
    assert.equal(result.evidence.length, 0);
  });

  it("counts houses from the Moon when the birth time is unknown", async () => {
    const noTime = buildNatalChart({ date: "1992-03-14", time: null, timezone: "Asia/Kolkata", latitude: 19.07, longitude: 72.88 });
    assert.equal(noTime.houseReference, "moon");
    assert.equal(noTime.houses[0].sign, noTime.moonSign);
    assert.ok(noTime.yogas.every((y) => !y.dependsOnAscendant));

    const result = await askQuestion({ chart: noTime, question: "How is my career?", now, dryRun: true });
    assert.ok(result.evidence.some((e) => e.kind === "caveat"));
  });
});
