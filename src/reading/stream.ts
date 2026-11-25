import type { ChatMessage } from "../lib/llm";
import { jsonCompletion, models, streamText } from "../lib/llm";
import { askQuestion, AskInput, AskResult, sanitise } from "./ask";
import { STREAM_SYSTEM_PROMPT } from "./prompt";

/*
  The streamed version of askQuestion: everything up to the prompt is
  prepared the same way (the message is read, the astrology level and
  evidence are chosen, memory is added), then the reply is written as plain
  text and sent piece by piece, so it appears like someone typing.
  Citations are read from the text afterwards, and follow-up suggestions
  come from a quick second call once the reply is done.
*/

export interface StreamHandlers {
  /* Sent before the first word: what kind of reply this is. */
  onStart?: (info: Pick<AskResult, "need" | "astrologyLevel" | "firstReading">) => void;
  onDelta: (text: string) => void;
}

const CITED = /\[([ER]\d+(?:\s*,\s*[ER]\d+)*)\]/g;

function citedIds(text: string): Set<string> {
  const ids = new Set<string>();
  for (const match of text.matchAll(CITED)) {
    for (const id of match[1].split(/\s*,\s*/)) ids.add(id);
  }
  return ids;
}

const FOLLOW_UP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["followUps"],
  properties: { followUps: { type: "array", items: { type: "string" } } }
};

/* Up to two short messages the person might send next, in their own voice. */
async function suggestFollowUps(history: ChatMessage[], message: string, reply: string): Promise<string[]> {
  try {
    const recent = [...history.slice(-4), { role: "user", content: message }, { role: "assistant", content: reply }]
      .map((m) => `${m.role === "user" ? "Person" : "Saarthi"}: ${m.content.slice(0, 1200)}`)
      .join("\n\n");

    const result = await jsonCompletion<{ followUps: string[] }>({
      model: models.memory(),
      temperature: 0.4,
      maxTokens: 150,
      schemaName: "follow_ups",
      schema: FOLLOW_UP_SCHEMA,
      messages: [
        {
          role: "system",
          content:
            "Suggest up to two short messages (under 12 words each) the person might naturally send next in this chat with Saarthi, a caring friend. Write them as the person would type them, about their own life, never as questions from Saarthi. An empty list is fine when nothing fits."
        },
        { role: "user", content: recent }
      ]
    });

    return result.followUps.map((f) => f.trim()).filter(Boolean).slice(0, 2);
  } catch (error) {
    console.warn("FOLLOW_UPS_FAILED", (error as Error).message);
    return [];
  }
}

export async function streamQuestion(input: AskInput, handlers: StreamHandlers): Promise<AskResult> {
  /* Prepare everything (and catch self-harm) exactly as a normal answer would. */
  const prepared = await askQuestion({ ...input, dryRun: true });

  handlers.onStart?.({ need: prepared.need, astrologyLevel: prepared.astrologyLevel, firstReading: prepared.firstReading });

  /* The self-harm response is fixed text; send it whole. */
  if (prepared.answer !== null) {
    handlers.onDelta(prepared.answer);
    return prepared;
  }

  const history = (input.history ?? []).slice(-8);
  const model = models.answer();
  const deep = prepared.astrologyLevel === "full";

  const text = await streamText({
    model,
    temperature: 0.6,
    maxTokens: prepared.firstReading || deep ? 1800 : 1200,
    messages: [{ role: "system", content: STREAM_SYSTEM_PROMPT }, ...history, { role: "user", content: prepared.prompt!.user }],
    onDelta: handlers.onDelta
  });

  const evidenceIds = new Set(prepared.evidence.map((e) => e.id));
  const remedyIds = new Set(prepared.remediesOffered.map((r) => r.ref));
  const cited = citedIds(text);

  /* While they are sharing, canned replies would break the flow: no follow-up chips. */
  const followUps = prepared.need === "share" ? [] : await suggestFollowUps(history, input.question, text);

  return {
    ...prepared,
    answer: sanitise(text.trim(), new Set([...evidenceIds, ...remedyIds])),
    evidenceUsed: [...cited].filter((id) => evidenceIds.has(id)),
    remedies: prepared.remediesOffered.filter((r) => cited.has(r.ref)),
    followUps,
    model,
    prompt: undefined
  };
}
