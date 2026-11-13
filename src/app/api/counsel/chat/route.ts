import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession, hashIp, clientIp } from "@/lib/session";
import { chatRequestSchema } from "@/lib/validators";
import { scrubPII } from "@/lib/pii";
import { hit, isCoolingDown, applyCooldown, isDuplicate, clearCooldown } from "@/lib/ratelimit";
import { moderate } from "@/lib/moderation";
import { CRISIS_PATTERNS } from "@/lib/prompts";
import { crisisBannerForContext } from "@/lib/crisis";
import { bumpStat, lookupCachedResponse, storeCachedResponse, sniffLanguage } from "@/lib/cache";
import {
  getConversation, addMessage, maybeRollSummary, looksLikeNewProblem,
  getMemory, renderMemory, updateMemoryFromExchange,
} from "@/lib/memory";
import {
  chatComplete, chatStream, estimateTokens, type ChatMessage,
} from "@/lib/ai/provider";
import {
  COUNSELOR_SYSTEM_PROMPT, PRAYER_OFFER_NOTE, PRAYER_YES_NOTE, PRAYER_NO_NOTE,
  COUNSELING_NOTE, OFF_TOPIC_REPLY, topicGuardMessages, personalizeMessages,
} from "@/lib/prompts";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_CONTEXT_MESSAGES = 8;
const DAILY_LIMIT = Number(process.env.COUNSEL_DAILY_LIMIT || 40);

type SseEvent = Record<string, unknown>;
function sse(event: SseEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

/** Deterministic prayer-choice matcher (EN + Tagalog variants). */
function isPrayerChoice(text: string): "yes" | "no" | null {
  const t = text.toLowerCase().trim();
  if (t.length > 60) return null;
  if (
    /^(yes|yeah|yep|yes please|yes, let's pray|lets pray|let's pray|please|i would like that|i'd like that|sure|of course|amen|oo|sige|opo|oo nga|yes po)\b/.test(t) ||
    /\b(let us pray|let's pray|pray with me|pray over this|i want to pray|please pray)\b/i.test(t)
  ) {
    return "yes";
  }
  if (
    /^(no|nope|nah|not now|no thanks|no thank you|not yet|maybe later|no need|just advise|just advice|no po|hindi|wag na|hindi na|ayoko|next time|skip)\b/.test(t) ||
    /\b(no need to pray|don'?t pray|do not pray|without prayer)\b/i.test(t)
  ) {
    return "no";
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Session unavailable — please refresh the page." }, { status: 400 });
  }

  // ── Rate limits: burst (per minute), daily (per session), per-IP ───────────
  const ipHash = hashIp(clientIp(req));
  if (!hit(`chat:ip:${ipHash}`, 30, 60 * 1000).ok || !hit(`chat:session:${session.id}`, 8, 60 * 1000).ok) {
    return NextResponse.json(
      { error: "Let's slow down for a breath — try again in a minute." },
      { status: 429 }
    );
  }
  if (!hit(`chat:daily:${session.id}`, DAILY_LIMIT, 24 * 60 * 60 * 1000).ok) {
    return NextResponse.json(
      { error: "You've reached today's conversation limit. You are welcome back tomorrow — and nothing you shared is ever stored with your name." },
      { status: 429 }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = chatRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Please check your message." }, { status: 400 });
  }

  // De-dup double submissions
  const dedupKey = `chat:${session.id}:${parsed.data.message.slice(0, 100)}`;
  if (isDuplicate(dedupKey)) {
    return NextResponse.json({ error: "That message is already on its way." }, { status: 409 });
  }

  // Cooldown after repeated off-topic attempts
  const cooldownSec = isCoolingDown(`chat-cool:${session.id}`);
  if (cooldownSec > 0) {
    return NextResponse.json(
      { error: `Let's rest here for a few minutes (${cooldownSec}s). When you're ready, I'm here — is there something on your heart?` },
      { status: 429 }
    );
  }

  // ── Prepare state ──────────────────────────────────────────────────────────
  const rawText = parsed.data.message;
  const cleanText = scrubPII(rawText);
  const language = sniffLanguage(cleanText);
  const convo = await getConversation(session.id);
  const memory = await getMemory(session.id);
  const memoryBlock = renderMemory(memory);

  const recent = await db.message.findMany({
    where: { conversationId: convo.id },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  const recentUserMsgs = recent.filter((m) => m.role === "user").map((m) => m.content);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: SseEvent) => controller.enqueue(sse(event));
      let fullResponse = "";
      let cacheResponseId: string | null = null;
      let wasCacheHit = false;

      try {
        send({ type: "meta", conversationId: convo.id });

        // ── Crisis check first (overrides everything) ─────────────────────────
        if (CRISIS_PATTERNS.some((rx) => rx.test(cleanText))) {
          await bumpStat("crisis_detected");
          const banner = crisisBannerForContext("chat");
          for (const chunk of banner.body.match(/[\s\S]{1,80}(\s|$)/g) ?? [banner.body]) {
            send({ type: "delta", text: chunk });
            fullResponse += chunk;
            await new Promise((r) => setTimeout(r, 25));
          }
          await addMessage(convo.id, "user", cleanText);
          await addMessage(convo.id, "assistant", fullResponse);
          await db.conversation.update({ where: { id: convo.id }, data: { stage: "counseling" } });
          send({ type: "done", crisis: true });
          return;
        }

        // ── Stage: awaiting the prayer choice ─────────────────────────────────
        const choice = isPrayerChoice(cleanText);
        if (convo.stage === "awaiting_prayer_choice" && choice) {
          clearCooldown(`chat-cool:${session.id}`);
          const problemText =
            [...recentUserMsgs].reverse().find((m) => !isPrayerChoice(m) && m.length > 12) ?? cleanText;

          await addMessage(convo.id, "user", cleanText);

          const history = recent
            .filter((m) => !isPrayerChoice(m.content))
            .slice(-MAX_CONTEXT_MESSAGES)
            .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 500) }));

          if (choice === "yes") {
            // Prayer accepted → prayer first, then cache-aware counsel (spec 4.2.3)
            const cached = await lookupCachedResponse(problemText, language);

            if (cached.hit && cached.response) {
              wasCacheHit = true;
              cacheResponseId = cached.id ?? null;
              const messages: ChatMessage[] = [
                {
                  role: "system",
                  content: `${COUNSELOR_SYSTEM_PROMPT}\n\nCURRENT STEP: PRAYER (accepted) + PERSONALIZED COUNSEL.
Write a short prayer (3–6 sentences) for their situation, addressed to God through Jesus Christ, ending with "Amen."
Then add the bridge line "Now, beloved friend, let me share a thought for your path…" and personalize the GENERAL COUNSEL below using WHAT WE REMEMBER (one sentence showing gentle continuity). Keep a metaphor, a real Scripture reference, a reflection question, and the freedom line. Answer in the language of their messages.`,
                },
                {
                  role: "user",
                  content: `GENERAL COUNSEL:\n${cached.response}\n\nWHAT WE REMEMBER:\n${memoryBlock || "(nothing yet)"}\n\nTheir situation: ${problemText}`,
                },
              ];
              const gen = await chatStream(messages, { maxTokens: 800, temperature: 0.7 });
              for await (const delta of gen) {
                send({ type: "delta", text: delta });
                fullResponse += delta;
              }
              await bumpStat("tokens_saved", 500);
            } else {
              const messages: ChatMessage[] = [
                { role: "system", content: `${COUNSELOR_SYSTEM_PROMPT}\n\n${PRAYER_YES_NOTE}` },
                ...(convo.summary ? [{ role: "system" as const, content: `CONVERSATION SO FAR (summary): ${convo.summary}` }] : []),
                ...(memoryBlock ? [{ role: "system" as const, content: `WHAT WE REMEMBER:\n${memoryBlock}` }] : []),
                ...history,
                { role: "user", content: problemText },
              ];
              const gen = await chatStream(messages, { maxTokens: 900, temperature: 0.75 });
              for await (const delta of gen) {
                send({ type: "delta", text: delta });
                fullResponse += delta;
              }
              // Cache the counsel portion (after the prayer) for future friends
              const counselPart = fullResponse.includes("===COUNSEL===")
                ? fullResponse.split("===COUNSEL===").slice(1).join(" ").trim()
                : (fullResponse.split(/Amen\.?/i).slice(1).join("Amen.").trim() || "");
              if (counselPart.length > 200) {
                await storeCachedResponse({ rawQuestion: problemText, response: counselPart, language, themeTags: memory.themes });
              }
            }

            await addMessage(convo.id, "assistant", fullResponse, { cacheHit: wasCacheHit });
            await db.conversation.update({ where: { id: convo.id }, data: { stage: "counseling" } });
            void updateMemoryFromExchange(session.id, `Friend: ${problemText}\nCounselor: ${fullResponse.slice(0, 800)}`, true);
          } else {
            // Declined → skip prayer, straight to counsel (cache-aware)
            const cached = await lookupCachedResponse(problemText, language);
            if (cached.hit && cached.response) {
              wasCacheHit = true;
              cacheResponseId = cached.id ?? null;
              const messages = personalizeMessages({
                cachedCounsel: cached.response,
                concern: problemText,
                summary: convo.summary,
                memory: memoryBlock ? `${memoryBlock}\nThey gently declined prayer earlier — respect that warmly.` : "They gently declined prayer earlier — respect that warmly.",
              });
              const gen = await chatStream(messages, { maxTokens: 700, temperature: 0.7 });
              for await (const delta of gen) {
                send({ type: "delta", text: delta });
                fullResponse += delta;
              }
            } else {
              const messages: ChatMessage[] = [
                { role: "system", content: `${COUNSELOR_SYSTEM_PROMPT}\n\n${PRAYER_NO_NOTE}` },
                ...(memoryBlock ? [{ role: "system" as const, content: `WHAT WE REMEMBER:\n${memoryBlock}` }] : []),
                ...history,
                { role: "user", content: problemText },
              ];
              const gen = await chatStream(messages, { maxTokens: 800, temperature: 0.75 });
              for await (const delta of gen) {
                send({ type: "delta", text: delta });
                fullResponse += delta;
              }
              if (fullResponse.length > 200) {
                await storeCachedResponse({ rawQuestion: problemText, response: fullResponse, language, themeTags: memory.themes });
              }
            }
            await addMessage(convo.id, "assistant", fullResponse, { cacheHit: wasCacheHit });
            await db.conversation.update({ where: { id: convo.id }, data: { stage: "counseling" } });
            void updateMemoryFromExchange(session.id, `Friend: ${problemText}\nCounselor: ${fullResponse.slice(0, 800)}`, false);
          }

          send({ type: "done", cacheHit: wasCacheHit, cachedResponseId: cacheResponseId });
          return;
        }

        // ── Topic guard (every non-choice message) ─────────────────────────────
        try {
          const { content } = await chatComplete(topicGuardMessages(cleanText), {
            maxTokens: 40, temperature: 0, json: true,
          });
          const verdict = JSON.parse(content) as { label?: string };
          if (verdict.label === "off_topic") {
            await bumpStat("off_topic");
            applyCooldown(`chat-cool:${session.id}`, 10 * 60 * 1000);
            for (const chunk of OFF_TOPIC_REPLY.match(/[\s\S]{1,80}(\s|$)/g) ?? [OFF_TOPIC_REPLY]) {
              send({ type: "delta", text: chunk });
              fullResponse += chunk;
              await new Promise((r) => setTimeout(r, 25));
            }
            await addMessage(convo.id, "user", cleanText, { offTopic: true });
            await addMessage(convo.id, "assistant", fullResponse);
            send({ type: "done", offTopic: true });
            return;
          }
        } catch {
          // classifier unavailable → assume good faith
        }

        // ── Message persistence + moderation ──────────────────────────────────
        await addMessage(convo.id, "user", cleanText);
        const moderation = await moderate("message", convo.id, cleanText);
        if (moderation.action === "hide") {
          const notice = "I'm not able to respond to that kind of content here. If something else is weighing on your heart, I'm listening.";
          for (const chunk of notice.match(/[\s\S]{1,80}(\s|$)/g) ?? [notice]) {
            send({ type: "delta", text: chunk });
            fullResponse += chunk;
          }
          await addMessage(convo.id, "assistant", fullResponse);
          send({ type: "done", blocked: true });
          return;
        }

        // New problem while counseling → back to the prayer offer
        const isNewProblem =
          convo.stage === "counseling" && looksLikeNewProblem(cleanText, recentUserMsgs.slice(-4));
        const stage: "awaiting_prayer_choice" | "counseling" = isNewProblem
          ? "awaiting_prayer_choice"
          : (convo.stage as "awaiting_prayer_choice" | "counseling");

        const note = stage === "awaiting_prayer_choice" ? PRAYER_OFFER_NOTE : COUNSELING_NOTE;

        const freshRecent = await db.message.findMany({
          where: { conversationId: convo.id },
          orderBy: { createdAt: "asc" },
          take: MAX_CONTEXT_MESSAGES,
        });

        const messages: ChatMessage[] = [
          { role: "system", content: COUNSELOR_SYSTEM_PROMPT },
          { role: "system", content: note },
          ...(convo.summary ? [{ role: "system" as const, content: `CONVERSATION SO FAR (summary): ${convo.summary}` }] : []),
          ...(memoryBlock ? [{ role: "system" as const, content: `WHAT WE REMEMBER:\n${memoryBlock}` }] : []),
          ...freshRecent.slice(0, -1).map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 500) })),
          { role: "user", content: cleanText },
        ];

        const tokensInEstimate = estimateTokens(messages);
        await bumpStat("llm_calls");
        const gen = await chatStream(messages, {
          maxTokens: stage === "awaiting_prayer_choice" ? 120 : 500,
          temperature: 0.75,
        });
        for await (const delta of gen) {
          send({ type: "delta", text: delta });
          fullResponse += delta;
        }

        await addMessage(convo.id, "assistant", fullResponse);
        await db.conversation.update({ where: { id: convo.id }, data: { stage } });
        await maybeRollSummary(convo.id);
        if (stage === "counseling") {
          void updateMemoryFromExchange(session.id, `Friend: ${cleanText}\nCounselor: ${fullResponse.slice(0, 800)}`, memory.prayed);
        }

        send({
          type: "done",
          stage,
          quickReplies: stage === "awaiting_prayer_choice" ? ["Yes, let's pray", "Not now"] : [],
          cacheHit: false,
          cachedResponseId: null,
          tokensInEstimate,
        });
      } catch (err) {
        console.error("counsel chat error", err);
        send({ type: "error", error: "Something interrupted our conversation — please send that again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
