import type { Prisma } from "@prisma/client";

import type { ChatMessage } from "../lib/llm";
import { prisma } from "../lib/prisma";

export class NotFoundError extends Error {}

const TITLE_LENGTH = 60;

function titleFrom(message: string): string {
  const text = message.replace(/\s+/g, " ").trim();
  return text.length > TITLE_LENGTH ? `${text.slice(0, TITLE_LENGTH - 1).trimEnd()}…` : text;
}

/* A conversation the user owns; someone else's id is reported as not found. */
async function ownedConversation(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, userId } });
  if (!conversation) throw new NotFoundError("Conversation not found");
  return conversation;
}

export async function getOrCreateConversation(userId: string, conversationId: string | undefined, firstMessage: string) {
  if (conversationId) return ownedConversation(userId, conversationId);
  return prisma.conversation.create({ data: { userId, title: titleFrom(firstMessage) } });
}

/* The last turns, oldest first, ready to hand to the model. */
export async function recentHistory(conversationId: string, limit = 8): Promise<ChatMessage[]> {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { role: true, content: true }
  });

  return rows
    .reverse()
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
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

export function listConversations(userId: string) {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: { id: true, title: true, createdAt: true, updatedAt: true }
  });
}

export async function getConversation(userId: string, conversationId: string) {
  const conversation = await ownedConversation(userId, conversationId);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, meta: true, createdAt: true }
  });

  return { ...conversation, messages };
}

export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  await ownedConversation(userId, conversationId);
  await prisma.conversation.delete({ where: { id: conversationId } });
}
