import type { ChatMessage } from "../lib/llm";
import { jsonCompletion, llmAvailable, models } from "../lib/llm";
import { prisma } from "../lib/prisma";
import {
  applyFactOps,
  Fact,
  FactCategory,
  FactOps,
  FOLD_BATCH,
  Memory,
  MEMORY_SCHEMA,
  MEMORY_SYSTEM_PROMPT,
  memoryUserMessage,
  planFold,
  SHORT_TERM_MESSAGES
} from "./core";

export class FactNotFoundError extends Error {}

function toFact(row: {
  id: string;
  category: string;
  text: string;
  eventDate: string | null;
  importance: number;
  updatedAt: Date;
}): Fact {
  return {
    id: row.id,
    category: row.category as FactCategory,
    text: row.text,
    eventDate: row.eventDate,
    importance: Math.min(3, Math.max(1, row.importance)) as 1 | 2 | 3,
    updatedAt: row.updatedAt
  };
}

export async function loadMemory(userId: string): Promise<Memory & { runningThrough: Date | null }> {
  const [state, facts] = await Promise.all([
    prisma.userMemory.findUnique({ where: { userId } }),
    prisma.memoryFact.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } })
  ]);

  return { running: state?.running ?? null, runningThrough: state?.runningThrough ?? null, facts: facts.map(toFact) };
}

/*
  Short-term memory: every message the running summary does not yet cover,
  word for word (at most a few more than the window, since folding keeps up),
  and when the person last wrote.
*/
export async function shortTermHistory(
  userId: string,
  runningThrough: Date | null
): Promise<{ history: ChatMessage[]; lastMessageAt: Date | null }> {
  const rows = await prisma.message.findMany({
    where: { conversation: { userId }, ...(runningThrough ? { createdAt: { gt: runningThrough } } : {}) },
    orderBy: { createdAt: "desc" },
    take: SHORT_TERM_MESSAGES + 8,
    select: { role: true, content: true, createdAt: true }
  });

  const lastUser = rows.find((m) => m.role === "user");

  return {
    history: rows
      .reverse()
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    lastMessageAt: lastUser?.createdAt ?? null
  };
}

/* One memory update per person at a time. */
const running = new Map<string, Promise<void>>();

/*
  Folds messages that have left the short-term window into the running
  summary and updates the long-term notes. Runs after a reply is sent, so
  the person never waits for it.
*/
export function scheduleMemoryUpdate(userId: string): void {
  if (!llmAvailable() || running.has(userId)) return;

  const job = updateMemory(userId)
    .catch((error) => console.warn("MEMORY_UPDATE_FAILED", (error as Error).message))
    .finally(() => running.delete(userId));

  running.set(userId, job);
}

async function updateMemory(userId: string): Promise<void> {
  /* A few rounds at most, so a long backlog catches up without one huge call. */
  for (let round = 0; round < 3; round++) {
    const memory = await loadMemory(userId);

    const unsummarised = await prisma.message.findMany({
      where: { conversation: { userId }, ...(memory.runningThrough ? { createdAt: { gt: memory.runningThrough } } : {}) },
      orderBy: { createdAt: "asc" },
      take: FOLD_BATCH + SHORT_TERM_MESSAGES,
      select: { role: true, content: true, createdAt: true }
    });

    const fold = planFold(unsummarised);
    if (!fold.length) return;

    const result = await jsonCompletion<{ running: string; factOps: FactOps }>({
      model: models.memory(),
      temperature: 0.2,
      maxTokens: 1500,
      schemaName: "saarthi_memory",
      schema: MEMORY_SCHEMA,
      messages: [
        { role: "system", content: MEMORY_SYSTEM_PROMPT },
        { role: "user", content: memoryUserMessage(new Date(), memory, fold) }
      ]
    });

    const changes = applyFactOps(memory.facts, result.factOps);
    const through = fold[fold.length - 1].createdAt;
    const summary = result.running.trim().slice(0, 2000) || memory.running;

    await prisma.$transaction([
      prisma.userMemory.upsert({
        where: { userId },
        update: { running: summary, runningThrough: through },
        create: { userId, running: summary, runningThrough: through }
      }),
      ...changes.remove.map((id) => prisma.memoryFact.deleteMany({ where: { id, userId } })),
      ...changes.update.map((f) =>
        prisma.memoryFact.updateMany({
          where: { id: f.id, userId },
          data: { category: f.category, text: f.text, eventDate: f.eventDate, importance: f.importance }
        })
      ),
      ...changes.create.map((f) => prisma.memoryFact.create({ data: { userId, ...f } }))
    ]);
  }
}

/* What the person sees under "What Saarthi remembers". */
export async function memoryView(userId: string) {
  const memory = await loadMemory(userId);
  return {
    running: memory.running,
    facts: memory.facts.map(({ updatedAt, ...f }) => ({ ...f, updatedAt: updatedAt?.toISOString() ?? null }))
  };
}

export async function forgetFact(userId: string, id: string): Promise<void> {
  const { count } = await prisma.memoryFact.deleteMany({ where: { id, userId } });
  if (!count) throw new FactNotFoundError("That memory doesn't exist");
}

/* Forget everything: long-term notes and the running summary. The chat itself stays. */
export async function forgetAll(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.memoryFact.deleteMany({ where: { userId } }),
    prisma.userMemory.deleteMany({ where: { userId } })
  ]);
}

/* When the chat is deleted, the running summary of it goes too; long-term notes stay until forgotten. */
export async function clearRunningMemory(userId: string): Promise<void> {
  await prisma.userMemory.deleteMany({ where: { userId } });
}
