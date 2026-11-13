import "server-only";
import { db } from "@/lib/db";
import { chatComplete } from "@/lib/ai/provider";
import { summarizerMessages, memoryDistillerMessages } from "@/lib/prompts";

/**
 * Conversation memory (spec 5.2).
 *
 * Short-term  : last ~8 messages are sent with every request (caller's job).
 * Rolling     : older turns are compressed into Conversation.summary.
 * Long-term   : one MemoryNote per anonymous id — themes, concerns, prayed,
 *               notes. The user can wipe it permanently at any time.
 */

const ROLLING_TRIGGER = 14; // when total messages exceed this, summarize older ones
const ROLLING_KEEP = 8; // messages kept verbatim after summarization

export async function getConversation(sessionId: string) {
  let convo = await db.conversation.findFirst({
    where: { sessionId },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!convo) {
    convo = await db.conversation.create({
      data: { sessionId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }
  return convo;
}

export async function addMessage(conversationId: string, role: string, content: string, flags: { offTopic?: boolean; cacheHit?: boolean } = {}) {
  return db.message.create({
    data: {
      conversationId,
      role,
      content,
      offTopic: flags.offTopic ?? false,
      cacheHit: flags.cacheHit ?? false,
    },
  });
}

/** Detects a clearly NEW problem vs. follow-up (cheap heuristic + stage reset). */
export function looksLikeNewProblem(text: string, recentUserMsgs: string[]): boolean {
  const t = text.toLowerCase();
  const isNewTopicMarker =
    /^(also|another thing|now (about|something else)|i have another|can i ask about something else|new problem|one more thing|different (thing|problem|topic))\b/.test(
      t
    );
  const gapFromLastUser = recentUserMsgs.length === 0;
  const longStandalone =
    text.length > 220 && !/\b(yes|no|maybe|ok|okay|thanks|salamat|opo|continue|go on|please)\b/.test(t.slice(0, 40));
  return isNewTopicMarker || gapFromLastUser || longStandalone;
}

/** Rolling summary: compress older turns once the thread grows. */
export async function maybeRollSummary(conversationId: string): Promise<string | null> {
  const convo = await db.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!convo || convo.messages.length <= ROLLING_TRIGGER) return convo?.summary ?? null;

  const toSummarize = convo.messages.slice(0, convo.messages.length - ROLLING_KEEP);
  const turns = toSummarize
    .map((m) => `${m.role === "user" ? "Friend" : "Counselor"}: ${m.content.slice(0, 400)}`)
    .join("\n");

  try {
    const { content } = await chatComplete(summarizerMessages(convo.summary, turns), {
      maxTokens: 220,
      temperature: 0.2,
    });
    const summary = content.trim();
    await db.message.deleteMany({ where: { id: { in: toSummarize.map((m) => m.id) } } });
    await db.conversation.update({ where: { id: conversationId }, data: { summary } });
    return summary;
  } catch {
    return convo.summary; // summarization is an optimization, never a hard dependency
  }
}

export type MemoryShape = { themes: string[]; concerns: string[]; prayed: boolean; notes: string };

export function emptyMemory(): MemoryShape {
  return { themes: [], concerns: [], prayed: false, notes: "" };
}

export function parseMemory(raw: { themes: string; concerns: string; prayed: boolean; notes: string } | null): MemoryShape {
  if (!raw) return emptyMemory();
  const parse = (s: string): string[] => {
    try {
      const arr = JSON.parse(s) as unknown;
      return Array.isArray(arr) ? arr.map(String).slice(0, 6) : [];
    } catch {
      return [];
    }
  };
  return {
    themes: parse(raw.themes),
    concerns: parse(raw.concerns),
    prayed: raw.prayed,
    notes: raw.notes || "",
  };
}

export async function getMemory(sessionId: string): Promise<MemoryShape> {
  const row = await db.memoryNote.findUnique({ where: { sessionId } });
  return parseMemory(row);
}

/** Render memory compactly for prompts (token-efficient). */
export function renderMemory(memory: MemoryShape): string {
  const parts: string[] = [];
  if (memory.themes.length) parts.push(`Themes: ${memory.themes.join(", ")}`);
  if (memory.concerns.length) parts.push(`Current concerns: ${memory.concerns.join("; ")}`);
  if (memory.prayed) parts.push("They have prayed with us before");
  if (memory.notes) parts.push(`Notes: ${memory.notes}`);
  return parts.join("\n");
}

/** Distill one exchange into the long-term memory (LLM, tiny prompt). */
export async function updateMemoryFromExchange(sessionId: string, exchange: string, prayed: boolean): Promise<void> {
  const current = await db.memoryNote.findUnique({ where: { sessionId } });
  const existingJson = JSON.stringify(
    current
      ? parseMemory(current)
      : emptyMemory()
  );
  try {
    const { content } = await chatComplete(memoryDistillerMessages(existingJson, exchange), {
      maxTokens: 220,
      temperature: 0.2,
      json: true,
    });
    const parsed = JSON.parse(content) as Partial<MemoryShape>;
    const merged: MemoryShape = {
      themes: (parsed.themes ?? parseMemory(current).themes ?? []).slice(0, 4).map(String),
      concerns: (parsed.concerns ?? []).slice(0, 4).map(String),
      prayed: prayed || parseMemory(current).prayed,
      notes: String(parsed.notes ?? parseMemory(current).notes ?? "").slice(0, 400),
    };
    await db.memoryNote.upsert({
      where: { sessionId },
      update: {
        themes: JSON.stringify(merged.themes),
        concerns: JSON.stringify(merged.concerns),
        prayed: merged.prayed,
        notes: merged.notes,
        updatedAt: new Date(),
      },
      create: {
        sessionId,
        themes: JSON.stringify(merged.themes),
        concerns: JSON.stringify(merged.concerns),
        prayed: merged.prayed,
        notes: merged.notes,
      },
    });
  } catch {
    // memory is best-effort; never block the answer
  }
}

/** "Clear my memory" — permanent, per spec. Also clears conversations? No:
 * conversations belong to chats; memory notes are the cross-visit continuity. */
export async function clearMemory(sessionId: string): Promise<void> {
  await db.memoryNote.deleteMany({ where: { sessionId } });
}
