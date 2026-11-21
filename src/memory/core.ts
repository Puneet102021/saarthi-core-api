/*
  Saarthi's memory, in three layers:

  - short-term: the latest messages, read word for word (the chat itself);
  - running: a short summary of what has been talked about lately, which
    absorbs messages as they leave the short-term window;
  - long-term: lasting notes about the person (people, work, events, what
    helps), kept current and visible to them.

  This file is the pure logic: what to fold, how to apply changes to the
  notes, and how memory is shown to the answering model. store.ts does the
  database and model calls.
*/

export const FACT_CATEGORIES = ["people", "work", "life", "event", "pattern", "helps", "goal", "preference"] as const;
export type FactCategory = (typeof FACT_CATEGORIES)[number];

export interface Fact {
  id: string;
  category: FactCategory;
  text: string;
  eventDate: string | null;
  importance: 1 | 2 | 3;
  updatedAt?: Date;
}

export interface Memory {
  running: string | null;
  facts: Fact[];
}

/* Messages always read word for word. */
export const SHORT_TERM_MESSAGES = 12;
/* Fold once at least this many messages have left the short-term window. */
export const FOLD_MIN = 4;
/* At most this many messages per summarising call. */
export const FOLD_BATCH = 40;
/* Upper bound on long-term notes; the least important, oldest go first. */
export const MAX_FACTS = 60;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/*
  Of the messages not yet in the running summary (oldest first), the ones to
  fold now: everything older than the short-term window, once there are
  enough to be worth a call, oldest batch first.
*/
export function planFold<M>(unsummarised: M[]): M[] {
  const outside = unsummarised.length - SHORT_TERM_MESSAGES;
  if (outside < FOLD_MIN) return [];
  return unsummarised.slice(0, Math.min(outside, FOLD_BATCH));
}

export interface FactInput {
  category: string;
  text: string;
  eventDate: string | null;
  importance: number;
}

export interface FactOps {
  add: FactInput[];
  update: (FactInput & { id: string })[];
  remove: string[];
}

export interface FactChanges {
  create: Omit<Fact, "id">[];
  update: Fact[];
  remove: string[];
}

const normalise = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function cleanFact(input: FactInput): Omit<Fact, "id"> | null {
  const category = FACT_CATEGORIES.includes(input.category as FactCategory) ? (input.category as FactCategory) : null;
  const text = typeof input.text === "string" ? input.text.replace(/\s+/g, " ").trim().slice(0, 300) : "";
  if (!category || !text) return null;

  const importance = Math.min(3, Math.max(1, Math.round(Number(input.importance) || 2))) as 1 | 2 | 3;
  const eventDate = typeof input.eventDate === "string" && DATE.test(input.eventDate) ? input.eventDate : null;

  return { category, text, eventDate, importance };
}

/* Turns the model's proposed changes into safe ones: known ids only, valid fields, no duplicates, within the cap. */
export function applyFactOps(existing: Fact[], ops: FactOps): FactChanges {
  const byId = new Map(existing.map((f) => [f.id, f]));

  const remove = [...new Set((ops.remove ?? []).filter((id) => byId.has(id)))];

  const update: Fact[] = [];
  for (const u of ops.update ?? []) {
    const current = byId.get(u.id);
    const clean = cleanFact(u);
    if (!current || !clean || remove.includes(u.id)) continue;
    update.push({ ...clean, id: u.id });
  }

  const known = new Set(
    [...existing.filter((f) => !remove.includes(f.id)), ...update].map((f) => normalise(f.text))
  );
  const create: Omit<Fact, "id">[] = [];
  for (const a of ops.add ?? []) {
    const clean = cleanFact(a);
    if (!clean || known.has(normalise(clean.text))) continue;
    known.add(normalise(clean.text));
    create.push(clean);
  }

  /* Keep within the cap by dropping the least important, oldest notes. */
  const remaining = existing.filter((f) => !remove.includes(f.id)).length + create.length;
  if (remaining > MAX_FACTS) {
    const candidates = existing
      .filter((f) => !remove.includes(f.id) && !update.some((u) => u.id === f.id))
      .sort((a, b) => a.importance - b.importance || (a.updatedAt?.getTime() ?? 0) - (b.updatedAt?.getTime() ?? 0));
    remove.push(...candidates.slice(0, remaining - MAX_FACTS).map((f) => f.id));
  }

  return { create, update, remove };
}

const CATEGORY_LABEL: Record<FactCategory, string> = {
  people: "People in their life",
  work: "Work and studies",
  life: "Life situation",
  event: "Events",
  pattern: "Patterns",
  helps: "What helps them",
  goal: "Goals",
  preference: "Preferences"
};

/* Memory as the answering model sees it; null when there is nothing yet. */
export function memoryBlock(memory: Memory | undefined): string | null {
  if (!memory || (!memory.running && memory.facts.length === 0)) return null;

  const sections: string[] = [];

  if (memory.facts.length) {
    const lines = FACT_CATEGORIES.flatMap((category) => {
      const facts = memory.facts
        .filter((f) => f.category === category)
        .sort((a, b) => b.importance - a.importance);
      if (!facts.length) return [];
      return [
        `${CATEGORY_LABEL[category]}:`,
        ...facts.map((f) => `- ${f.text}${f.eventDate ? ` (${f.eventDate})` : ""}`)
      ];
    });
    sections.push(
      ["WHAT YOU REMEMBER ABOUT THEM (long-term memory from earlier conversations; trust what they say now if it differs)", ...lines].join("\n")
    );
  }

  if (memory.running) {
    sections.push(`WHERE YOUR CONVERSATION HAS BEEN LATELY (running memory; the latest messages follow in full)\n${memory.running}`);
  }

  return sections.join("\n\n");
}

/* The summariser's instructions. */
export const MEMORY_SYSTEM_PROMPT = `You keep the memory of Saarthi, a companion that supports one person through an ongoing chat, using astrology and everyday psychology. You receive today's date, the current running summary, the current long-term notes (with ids), and older messages that are leaving the recent window. Update both.

Running summary ("running"):
- Up to 180 words, third person ("They ..."), oldest first, most recent last.
- What has been talked about lately: open threads, how they have been feeling and how that is changing, what Saarthi suggested and how they took it, questions still open.
- Fold the new messages in; compress older parts; drop details that are resolved and over a month old unless still relevant.

Long-term notes ("factOps"):
- Lasting, useful things a caring friend would remember: people (names and relationships), work or studies, life situation, events with dates, patterns in how they react, what helps or doesn't, goals, preferences (for example, prefers practical suggestions to rituals).
- One idea per note, short, factual, third person. Categories: people, work, life, event, pattern, helps, goal, preference. Importance: 1 minor, 2 useful, 3 central to their story.
- For events, set eventDate (YYYY-MM-DD), working out relative dates ("next Friday") from the message dates. When an event has happened, update the note with how it went.
- Update a note when it changes; remove notes that are no longer true or that they asked Saarthi to forget. Never duplicate an existing note.
- Only record what the person said about themselves and their life. Do not record astrology (the chart is calculated separately).
- Never record contact details, addresses, ID, account or card numbers, passwords, or other people's private details beyond name and relationship. Record self-harm or crisis gently, without detail (for example, "Went through a very dark patch in November 2026; Tele-MANAS was suggested").
- If nothing lasting was said, leave factOps empty.

Return JSON only.`;

export const MEMORY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["running", "factOps"],
  properties: {
    running: { type: "string" },
    factOps: {
      type: "object",
      additionalProperties: false,
      required: ["add", "update", "remove"],
      properties: {
        add: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["category", "text", "eventDate", "importance"],
            properties: {
              category: { type: "string", enum: [...FACT_CATEGORIES] },
              text: { type: "string" },
              eventDate: { type: ["string", "null"] },
              importance: { type: "integer" }
            }
          }
        },
        update: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "category", "text", "eventDate", "importance"],
            properties: {
              id: { type: "string" },
              category: { type: "string", enum: [...FACT_CATEGORIES] },
              text: { type: "string" },
              eventDate: { type: ["string", "null"] },
              importance: { type: "integer" }
            }
          }
        },
        remove: { type: "array", items: { type: "string" } }
      }
    }
  }
};

export function memoryUserMessage(
  today: Date,
  memory: Memory,
  messages: { role: string; content: string; createdAt: Date }[]
): string {
  const facts = memory.facts.length
    ? memory.facts
        .map((f) => `[${f.id}] (${f.category}, importance ${f.importance}${f.eventDate ? `, ${f.eventDate}` : ""}) ${f.text}`)
        .join("\n")
    : "(none yet)";

  const transcript = messages
    .map((m) => `[${m.createdAt.toISOString().slice(0, 10)} ${m.role === "user" ? "Person" : "Saarthi"}] ${m.content.slice(0, 2500)}`)
    .join("\n\n");

  return [
    `Today: ${today.toISOString().slice(0, 10)}`,
    "",
    `CURRENT RUNNING SUMMARY\n${memory.running ?? "(none yet)"}`,
    "",
    `CURRENT LONG-TERM NOTES\n${facts}`,
    "",
    `MESSAGES LEAVING THE RECENT WINDOW (oldest first)\n${transcript}`
  ].join("\n");
}
