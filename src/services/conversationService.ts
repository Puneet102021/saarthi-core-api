import type { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";

/*
  Each person has one continuous chat with Saarthi, like talking to a friend:
  no threads to start, name or archive. Messages are stored under a
  Conversation row; the stream is every message the person has ever sent,
  across rows, so chats from before the single-stream change merge in.
*/

export class NotFoundError extends Error {}

/* The row new messages are written to: the person's most recent one, or a new one. */
export async function getOrCreateThread(userId: string) {
  const latest = await prisma.conversation.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
  return latest ?? prisma.conversation.create({ data: { userId, title: "Saarthi" } });
}

export async function appendTurn(
  conversationId: string,
  userMessage: string,
  assistantMessage: string,
  meta: Prisma.InputJsonValue
): Promise<void> {
  const now = Date.now();

  await prisma.$transaction([
    /* Distinct timestamps keep the pair in order when read back. */
    prisma.message.create({
      data: { conversationId, role: "user", content: userMessage, createdAt: new Date(now) }
    }),
    prisma.message.create({
      data: { conversationId, role: "assistant", content: assistantMessage, meta, createdAt: new Date(now + 1) }
    }),
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date(now + 1) } })
  ]);
}

/* A page of the person's chat, newest page first, returned oldest first; `before` pages further back. */
export async function listMessages(userId: string, before: Date | undefined, limit: number) {
  const rows = await prisma.message.findMany({
    where: { conversation: { userId }, ...(before ? { createdAt: { lt: before } } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: { id: true, role: true, content: true, meta: true, createdAt: true }
  });

  return { messages: rows.slice(0, limit).reverse(), hasMore: rows.length > limit };
}

/* Deletes every message the person has exchanged with Saarthi. */
export async function clearHistory(userId: string): Promise<number> {
  const { count } = await prisma.conversation.deleteMany({ where: { userId } });
  return count;
}
