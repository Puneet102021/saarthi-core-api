import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildNatalChart } from "../src/astrology/chart";
import { askQuestion } from "../src/reading/ask";
import { keywordIntent } from "../src/reading/intent";
import { selectRemedies } from "../src/reading/remedies";

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

describe("inferring what the person needs (keywords)", () => {
  const need = (q: string) => keywordIntent(q, now).need;

  it("hears venting as a need for support", () => {
    assert.equal(need("I'm so tired, nothing ever works out for me"), "support");
    assert.equal(need("I can't cope with this anymore"), "support");
  });

  it("hears struggle plus a question as support and guidance", () => {
    assert.equal(need("Why is everything going wrong, when will it end?"), "support_guidance");
  });

  it("recognises a daily check-in", () => {
    assert.equal(need("How's today looking for me?"), "daily");
  });

  it("recognises wanting to make the most of good times", () => {
    assert.equal(need("I just got promoted, how do I make the most of it?"), "optimise");
  });

  it("treats a plain question as guidance", () => {
    assert.equal(need("Should I change jobs?"), "guidance");
  });

  it("notices a request for remedies and distress", () => {
    assert.equal(keywordIntent("What remedies help with Saturn?", now).wantsRemedies, true);
    assert.equal(keywordIntent("Should I change jobs?", now).wantsRemedies, false);
    assert.equal(keywordIntent("I feel hopeless and overwhelmed", now).sensitive, "distress");
  });
});

describe("askQuestion by need (dry run)", () => {
  it("keeps support answers light on astrology", async () => {
    const result = await askQuestion({ chart, question: "I'm exhausted, nothing works out for me", now, dryRun: true });
    assert.equal(result.need, "support");
    assert.ok(result.evidence.length <= 7, `${result.evidence.length} items`);
    assert.ok(result.evidence.some((e) => e.domain === "mind" || e.kind === "dasha"));
    assert.ok(result.remediesOffered.length > 0, "a struggling person is offered remedies");
    assert.match(result.prompt!.user, /What they seem to need: support/);
  });

  it("reads the day for a daily check-in", async () => {
    const result = await askQuestion({ chart, question: "How's today?", now, dryRun: true });
    assert.equal(result.need, "daily");
    assert.ok(result.evidence.some((e) => e.key === "daily:chandra-bala"));
    assert.ok(result.evidence.some((e) => e.key === "daily:tara-bala"));
    assert.ok(result.evidence.length <= 6, `${result.evidence.length} items`);
    assert.ok(result.remediesOffered.length <= 1);
  });

  it("offers strengthening practices in good times", async () => {
    const result = await askQuestion({
      chart,
      question: "Things are finally going well, how do I make the most of it?",
      now,
      dryRun: true
    });
    assert.equal(result.need, "optimise");
    assert.ok(result.remediesOffered.length > 0);
    assert.ok(result.remediesOffered.every((r) => r.framing === "strengthen"));
  });

  it("offers remedies when asked, citable as R#", async () => {
    const result = await askQuestion({ chart, question: "What can I do about my career?", now, dryRun: true });
    assert.ok(result.remediesOffered.length > 0);
    assert.deepEqual(
      result.remediesOffered.map((r) => r.ref),
      result.remediesOffered.map((_, i) => `R${i + 1}`)
    );
    assert.match(result.prompt!.user, /REMEDY OPTIONS/);
    assert.match(result.prompt!.user, /\[R1\]/);
  });

  it("offers no remedies for a neutral question unless the evidence is mostly challenging", async () => {
    const result = await askQuestion({ chart, question: "What is my personality like?", now, dryRun: true });
    const scored = result.evidence.filter((e) => e.kind !== "caveat" && e.polarity !== "neutral");
    const hard = scored.filter((e) => e.polarity === "challenging").length / scored.length;
    assert.equal(result.remediesOffered.length > 0, hard >= 0.6);
    if (!result.remediesOffered.length) assert.doesNotMatch(result.prompt!.user, /REMEDY OPTIONS/);
  });

  it("puts the onboarding profile in the brief", async () => {
    const result = await askQuestion({
      chart,
      question: "Should I change jobs?",
      now,
      dryRun: true,
      profile: { name: "Asha", pressureResponse: "I go quiet and withdraw" }
    });
    assert.match(result.prompt!.user, /ABOUT THE PERSON/);
    assert.match(result.prompt!.user, /I go quiet and withdraw/);
    assert.match(result.prompt!.user, /Name: Asha/);
  });
});

describe("remedy framing", () => {
  it("keeps good times framed as strengthening even when they ask what to do", async () => {
    const base = keywordIntent("Things are going well, how do I make the most of it?", now);
    const result = await askQuestion({ chart, question: "Things are going well, how do I make the most of it?", now, dryRun: true });
    const offered = selectRemedies(chart, result.evidence, { ...base, wantsRemedies: true }, now);
    assert.ok(offered.length > 0);
    assert.ok(offered.every((r) => r.framing === "strengthen"));
  });
});

describe("daily check-in for tomorrow", () => {
  it("reads tomorrow's Moon when asked about tomorrow", async () => {
    const result = await askQuestion({ chart, question: "How does tomorrow look?", now, dryRun: true });
    const day = result.evidence.find((e) => e.key === "daily:chandra-bala")!;
    assert.equal(day.timeframe!.start, "2026-10-22");
    assert.match(day.title, /^Tomorrow's Moon/);
  });
});
