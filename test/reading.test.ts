import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildNatalChart } from "../src/astrology/chart";
import { askQuestion } from "../src/reading/ask";
import { keywordIntent } from "../src/reading/intent";
import { selectRemedies } from "../src/reading/remedies";

/* These run without a model: no OPENAI_API_KEY means keyword intent and dry runs. */
delete process.env.OPENAI_API_KEY;

const now = new Date("2026-10-21T00:00:00Z");

/* Earlier turns, so a reply is a follow-up rather than a conversation's first reading. */
const earlier = [
  { role: "user" as const, content: "Hello" },
  { role: "assistant" as const, content: "Hello. What's on your mind?" }
];

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
    /* A first reading: up to 8 natal facts and 9 + 4 timing facts. */
    assert.ok(result.evidence.length >= 8 && result.evidence.length <= 22, `${result.evidence.length} items`);
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
    const result = await askQuestion({ chart, question: "I'm exhausted, nothing works out for me", history: earlier, now, dryRun: true });
    assert.equal(result.need, "support");
    assert.ok(result.evidence.length <= 7, `${result.evidence.length} items`);
    assert.ok(result.evidence.some((e) => e.domain === "mind" || e.kind === "dasha"));
    /* Mid-conversation, a friend does not keep handing out tips unless asked. */
    assert.equal(result.remediesOffered.length, 0);
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
    const result = await askQuestion({ chart, question: "What is my personality like?", history: earlier, now, dryRun: true });
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

describe("first reading", () => {
  it("opens a new topic as a friend, with just enough astrology to say when things shift", async () => {
    const result = await askQuestion({ chart, question: "I'm exhausted, nothing works out for me", now, dryRun: true });
    const keys = result.evidence.map((e) => e.key);
    assert.equal(result.firstReading, true);
    assert.match(result.prompt!.user, /NEW TOPIC/);
    assert.doesNotMatch(result.prompt!.user, /ASTROLOGY IN DEPTH/);
    assert.ok(keys.some((k) => k.startsWith("dasha:now:")), "the phase they are in");
    assert.ok(keys.some((k) => k.startsWith("dasha:next:") || k.startsWith("upcoming:")), "when it shifts");
    assert.ok(result.evidence.length <= 8, `${result.evidence.length} items`);
    assert.ok(result.remediesOffered.length > 0);
  });

  it("goes deep when they ask about their chart", async () => {
    const result = await askQuestion({
      chart,
      question: "What dasha am I in, and what's coming next astrologically?",
      history: earlier,
      now,
      dryRun: true
    });
    const keys = result.evidence.map((e) => e.key);
    assert.equal(result.intent.wantsAstrology, true);
    assert.match(result.prompt!.user, /ASTROLOGY IN DEPTH/);
    for (const level of [1, 2, 3]) assert.ok(keys.includes(`dasha:now:${level}`), `running level ${level}`);
    assert.ok(keys.some((k) => k.startsWith("dasha:next:")), "next period");
    assert.ok(keys.some((k) => k.startsWith("upcoming:")), "upcoming transit");
    assert.match(result.prompt!.user, /In this chart \w+ rules/);
  });

  it("keeps astrology in the background for ordinary life questions", () => {
    assert.equal(keywordIntent("My manager criticised me in front of everyone", now).wantsAstrology, false);
    assert.equal(keywordIntent("Is Saturn the reason things are slow?", now).wantsAstrology, true);
  });

  it("keeps later turns conversational", async () => {
    const result = await askQuestion({
      chart,
      question: "I'm exhausted, nothing works out for me",
      history: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "Hello, how are you?" }
      ],
      now,
      dryRun: true
    });
    assert.doesNotMatch(result.prompt!.user, /NEW TOPIC|ASTROLOGY IN DEPTH/);
    assert.ok(!result.evidence.some((e) => e.key.startsWith("upcoming:")));
  });

  it("keeps daily check-ins short even when they open a conversation", async () => {
    const result = await askQuestion({ chart, question: "How's today?", now, dryRun: true });
    assert.doesNotMatch(result.prompt!.user, /NEW TOPIC|ASTROLOGY IN DEPTH/);
  });

  it("never words the 8th house as lifespan", async () => {
    const result = await askQuestion({ chart, question: "Should I change jobs?", now, dryRun: true });
    assert.doesNotMatch(result.prompt!.user, /In this chart[^.]*longevity/);
  });
});

describe("one continuous chat", () => {
  it("gives a full reading again when they come back after a week or more", async () => {
    const result = await askQuestion({
      chart,
      question: "I'm exhausted, nothing works out for me",
      history: earlier,
      lastMessageAt: new Date(now.getTime() - 9 * 24 * 3600 * 1000),
      now,
      dryRun: true
    });
    assert.equal(result.firstReading, true);
    assert.match(result.prompt!.user, /NEW TOPIC/);
    assert.match(result.prompt!.user, /back after about 9 days/);
  });

  it("welcomes them back after a few days but keeps the conversation going", async () => {
    const result = await askQuestion({
      chart,
      question: "Things with my sister are a bit better now",
      history: earlier,
      lastMessageAt: new Date(now.getTime() - 3 * 24 * 3600 * 1000),
      now,
      dryRun: true
    });
    assert.equal(result.firstReading, false);
    assert.match(result.prompt!.user, /back after about 3 days/);
  });

  it("keeps talking, without a full reading, a few minutes later", async () => {
    const result = await askQuestion({
      chart,
      question: "I'm exhausted, nothing works out for me",
      history: earlier,
      lastMessageAt: new Date(now.getTime() - 5 * 60 * 1000),
      now,
      dryRun: true
    });
    assert.equal(result.firstReading, false);
    assert.doesNotMatch(result.prompt!.user, /back after/);
  });

  it("tells the model there are no separate chats", async () => {
    const result = await askQuestion({ chart, question: "Should I change jobs?", now, dryRun: true });
    assert.match(result.prompt!.system, /no separate chats/);
  });
});

describe("memory in the brief", () => {
  it("puts long-term notes and the running summary in the prompt", async () => {
    const result = await askQuestion({
      chart,
      question: "Feeling a bit nervous today",
      history: earlier,
      now,
      dryRun: true,
      memory: {
        running: "They have been preparing for an interview and feeling anxious.",
        facts: [{ id: "f1", category: "event", text: "Job interview at City Hospital", eventDate: "2026-10-23", importance: 3 }]
      }
    });
    assert.match(result.prompt!.user, /WHAT YOU REMEMBER ABOUT THEM/);
    assert.match(result.prompt!.user, /Job interview at City Hospital \(2026-10-23\)/);
    assert.match(result.prompt!.user, /preparing for an interview/);
    assert.match(result.prompt!.system, /caring friend would/);
  });
});
