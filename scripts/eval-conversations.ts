/*
  Scripted conversations, scored by a judge model, to measure how Saarthi
  talks rather than guess. Each conversation is a fixed list of the person's
  messages; Saarthi's replies are generated live, turn by turn, and each one
  is scored against a rubric that includes how much astrology the moment
  called for.

    npx tsx scripts/eval-conversations.ts <report.md> [label] [--stream]

  --stream scores the streamed replies the web app uses.

  Needs OPENAI_API_KEY. Uses no database.
*/
import "dotenv/config";
import fs from "fs";

import { buildNatalChart } from "../src/astrology/chart";
import { ChatMessage, jsonCompletion } from "../src/lib/llm";
import { askQuestion } from "../src/reading/ask";
import { streamQuestion } from "../src/reading/stream";

type Level = "none" | "subtle" | "full";

interface Script {
  name: string;
  profile: { name: string; pressureResponse?: string; primaryFocus?: string };
  /* The person's messages and how much astrology each moment calls for. */
  turns: { message: string; astrology: Level }[];
}

const SCRIPTS: Script[] = [
  {
    name: "Snow story (sharing)",
    profile: { name: "Puneet", pressureResponse: "I push harder and take control" },
    turns: [
      { message: "just got back from a bike trip to leh, it was rough", astrology: "none" },
      { message: "got stuck at gata loops for three days in a tent, snow everywhere", astrology: "none" },
      { message: "three blankets and it still felt like being naked", astrology: "none" },
      { message: "i had to get out riding my bike 4 to 5 kms on a snow laden road before the next storm hits", astrology: "none" },
      { message: "it slipped every 100 mtrs", astrology: "none" },
      { message: "yes reached keylong and there was no more snow", astrology: "none" }
    ]
  },
  {
    name: "Breakup",
    profile: { name: "Ravi", pressureResponse: "I overthink every option", primaryFocus: "Love and relationships" },
    turns: [
      { message: "My girlfriend and I broke up last week", astrology: "none" },
      { message: "I keep checking her Instagram, it's pathetic", astrology: "none" },
      { message: "Why does this keep happening to me in every relationship?", astrology: "subtle" }
    ]
  },
  {
    name: "Work stress",
    profile: { name: "Asha", pressureResponse: "I go quiet and withdraw", primaryFocus: "Career and work" },
    turns: [
      { message: "Work has been really hard lately and I keep doubting myself", astrology: "none" },
      { message: "My manager criticised my work in front of everyone today. I just went quiet.", astrology: "none" },
      { message: "Honestly when will this phase end?", astrology: "subtle" }
    ]
  },
  {
    name: "Good news",
    profile: { name: "Meera" },
    turns: [
      { message: "I GOT THE JOB!!", astrology: "none" },
      { message: "Starting on the 1st, bit nervous though", astrology: "none" }
    ]
  },
  {
    name: "Astrology question",
    profile: { name: "Asha" },
    turns: [
      { message: "What dasha am I in right now and what does it mean for me?", astrology: "full" },
      { message: "And what comes after this?", astrology: "full" }
    ]
  },
  {
    name: "Daily check-in",
    profile: { name: "Asha" },
    turns: [{ message: "Morning! How's today looking?", astrology: "subtle" }]
  }
];

const CRITERIA = [
  "specific",
  "oneGoodQuestion",
  "noUnsolicitedAdvice",
  "astrologyFit",
  "lengthFit",
  "warmth",
  "wantToReply"
] as const;

const JUDGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [...CRITERIA, "note"],
  properties: {
    ...Object.fromEntries(CRITERIA.map((c) => [c, { type: "integer" }])),
    note: { type: "string" }
  }
};

const JUDGE_PROMPT = `You judge replies from Saarthi, a companion app meant to feel like texting a caring, curious friend who happens to know astrology. The gold standard is a friend who reacts honestly, mirrors the person's exact details and does something with them, shows understanding through knowledge rather than advice, names what the experience really meant, calls back the person's own words, and ends with one concrete question about the next part of their story, so that the person wants to keep talking.

Score the LAST reply from 1 (poor) to 5 (excellent) on:
- specific: uses the person's actual details and words, not generic comfort.
- oneGoodQuestion: ends with one concrete, easy-to-answer question that moves their story forward (5); a generic "how do you feel" question (2); several questions or none (1). A full astrology explanation may end with a lighter question.
- noUnsolicitedAdvice: 5 if it gives no tips, exercises or suggestions they did not ask for; lower for each unrequested tip; 1 for a list of tips.
- astrologyFit: the moment called for EXPECTED astrology. none: any astrology scores 1, none scores 5. subtle: at most one plain-language sentence woven in, naming no planets, signs, houses or periods (5); none at all (4); one sentence that names a planet or period (3); two or more astrology sentences (2); heavy or jargon (1). full: a proper, clear explanation (5); thin (2). Offering to "tell you more about your chart" counts against it at every level.
- lengthFit: length suits the person's message (short message, short-to-medium reply; a direct astrology question may get more).
- warmth: sounds like a real friend, not a therapist, report or customer service.
- wantToReply: how much the person would want to send another message.
Add a one-sentence note on the biggest weakness.`;

const STREAM = process.argv.includes("--stream");

async function run() {
  const out = process.argv[2];
  const label = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : "run";
  if (!out) throw new Error("Usage: eval-conversations.ts <report.md> [label]");

  const chart = buildNatalChart({ date: "1992-03-14", time: "06:45", timezone: "Asia/Kolkata", latitude: 19.07, longitude: 72.88 });
  const now = new Date("2026-11-25T08:00:00Z");

  const totals: Record<string, number[]> = Object.fromEntries(CRITERIA.map((c) => [c, []]));
  let md = `# Conversation eval: ${label}\n\nAnswer model: ${process.env.OPENAI_MODEL ?? "(default)"}\n`;

  for (const script of SCRIPTS) {
    md += `\n## ${script.name}\n`;
    const history: ChatMessage[] = [];
    let turnsSinceAstrology: number | null = null;

    for (const turn of script.turns) {
      const input = { chart, question: turn.message, history: [...history], profile: script.profile, now, turnsSinceAstrology };
      const result = STREAM ? await streamQuestion(input, { onDelta: () => {} }) : await askQuestion(input);
      turnsSinceAstrology =
        result.astrologyLevel !== "none" ? 0 : turnsSinceAstrology === null ? null : turnsSinceAstrology + 1;
      const reply = (result.answer ?? "").replace(/\s*\[[ER]\d+(?:\s*,\s*[ER]\d+)*\]/g, "");

      const transcript = [...history, { role: "user", content: turn.message }, { role: "assistant", content: reply }]
        .map((m) => `${m.role === "user" ? "Person" : "Saarthi"}: ${m.content}`)
        .join("\n\n");

      const score = await jsonCompletion<Record<(typeof CRITERIA)[number], number> & { note: string }>({
        model: "gpt-4.1",
        temperature: 0,
        maxTokens: 400,
        schemaName: "reply_score",
        schema: JUDGE_SCHEMA,
        messages: [
          { role: "system", content: JUDGE_PROMPT },
          { role: "user", content: `EXPECTED astrology for the last reply: ${turn.astrology}\n\nCONVERSATION\n${transcript}` }
        ]
      });

      for (const c of CRITERIA) totals[c].push(score[c]);

      const words = reply.split(/\s+/).filter(Boolean).length;
      md += `\n**Person:** ${turn.message}\n\n**Saarthi** (${words} words; expected astrology: ${turn.astrology}; used: ${result.astrologyLevel}; need: ${result.need}):\n\n${reply}\n\n`;
      md += `> ${CRITERIA.map((c) => `${c} ${score[c]}`).join(" · ")}\n> ${score.note}\n`;

      history.push({ role: "user", content: turn.message }, { role: "assistant", content: result.answer ?? "" });
      process.stdout.write(".");
    }
  }

  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const summary = CRITERIA.map((c) => `| ${c} | ${avg(totals[c]).toFixed(2)} |`).join("\n");
  const overall = avg(CRITERIA.map((c) => avg(totals[c])));

  md = md.replace("\n", `\n\n| Criterion | Average (1-5) |\n| --- | --- |\n${summary}\n| **overall** | **${overall.toFixed(2)}** |\n`);
  fs.writeFileSync(out, md);

  console.log(`\n${label}: overall ${overall.toFixed(2)}`);
  for (const c of CRITERIA) console.log(`  ${c.padEnd(20)} ${avg(totals[c]).toFixed(2)}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
