import "server-only";
import { CRISIS_BANNER, CHAT_CRISIS } from "@/lib/crisis-static";

/**
 * Server-side helpers for crisis copy (re-exports the client-safe constants so
 * API routes can attach them to moderation/crisis responses).
 */
export function crisisBannerForContext(kind: "forum" | "chat"): { title: string; body: string } {
  if (kind === "chat") {
    return { title: CRISIS_BANNER.title, body: CHAT_CRISIS };
  }
  return { title: CRISIS_BANNER.title, body: CRISIS_BANNER.body };
}

export { CRISIS_BANNER };
