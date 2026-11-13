import "server-only";
import { chatComplete } from "@/lib/ai/provider";
import { moderationMessages, CRISIS_PATTERNS, HIDE_PATTERNS } from "@/lib/prompts";
import { db } from "@/lib/db";

export type ModerationVerdict = {
  action: "allow" | "flag" | "hide" | "crisis";
  reason: string;
  scores: Record<string, unknown>;
};

/**
 * Three-layer moderation for every post / comment / chat message:
 *  1. Crisis regex (EN + Tagalog) — self-harm & abuse → "crisis".
 *  2. Deterministic hide-list (porn, drugs, spam).
 *  3. AI moderation: OpenAI /moderations when OPENAI_API_KEY is set
 *     (free endpoint), otherwise a tiny gpt-4o-mini classifier via the SDK.
 * Every verdict is logged to ModerationLog for /admin.
 */
export async function moderate(
  targetType: "post" | "comment" | "message",
  targetId: string,
  text: string
): Promise<ModerationVerdict> {
  const scores: Record<string, unknown> = {};
  let verdict: ModerationVerdict = { action: "allow", reason: "", scores };

  for (const rx of CRISIS_PATTERNS) {
    if (rx.test(text)) {
      verdict = { action: "crisis", reason: "self-harm or abuse signal", scores };
      break;
    }
  }

  if (verdict.action === "allow") {
    for (const rx of HIDE_PATTERNS) {
      if (rx.test(text)) {
        verdict = { action: "hide", reason: "disallowed content", scores };
        break;
      }
    }
  }

  if (verdict.action === "allow") {
    try {
      if (process.env.OPENAI_API_KEY) {
        const res = await fetch("https://api.openai.com/v1/moderations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({ model: "omni-moderation-latest", input: text.slice(0, 4000) }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            results: Array<{ flagged: boolean; categories: Record<string, boolean> }>;
          };
          const r = data.results?.[0];
          scores.openai = r?.categories ?? {};
          if (r?.flagged) {
            verdict = { action: "hide", reason: "openai moderation flagged", scores };
          }
        }
      } else {
        const { content } = await chatComplete(moderationMessages(text), {
          maxTokens: 80,
          temperature: 0,
          json: true,
        });
        try {
          const parsed = JSON.parse(content) as { action: string; reason?: string };
          const action = parsed.action;
          if (action === "hide" || action === "flag") {
            verdict = { action, reason: parsed.reason || "ai moderation", scores };
          } else if (parsed.reason === "crisis-review") {
            verdict = { action: "crisis", reason: "crisis-review", scores };
          }
        } catch {
          // unparsable → default allow
        }
      }
    } catch {
      // moderation service down → fail open (community report button is the backstop)
    }
  }

  try {
    await db.moderationLog.create({
      data: { targetType, targetId, action: verdict.action, reason: verdict.reason, scores: JSON.stringify(scores) },
    });
  } catch {
    // logging must never break the user flow
  }

  return verdict;
}
