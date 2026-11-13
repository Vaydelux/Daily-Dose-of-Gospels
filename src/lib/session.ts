import "server-only";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/session-id";

/**
 * 100% anonymous sessions.
 *
 * - The visitor gets a random opaque id in an HTTP-only cookie (`ddog_sid`).
 * - The display name ("Faithful Sparrow 4821") is derived deterministically
 *   from the random id — stable across visits, never user-chosen, never PII.
 * - No names, emails, profiles, or IP addresses are stored anywhere.
 * - A middleware sets the cookie so even the first server render has an id.
 */

export const ADMIN_COOKIE = "ddog_admin";

const ADJECTIVES = [
  "Faithful", "Gentle", "Humble", "Courageous", "Peaceful", "Joyful",
  "Steadfast", "Radiant", "Watchful", "Tender", "Brave", "Quiet",
  "Hopeful", "Kindly", "Honest", "Patient", "Loyal", "Serene",
];

const NOUNS = [
  "Sparrow", "Dove", "Pilgrim", "Lantern", "Shepherd", "Anchor",
  "Cedar", "Lighthouse", "Olive", "Wellspring", "Sower", "Harvest",
  "Willow", "Candle", "River", "Fig Tree", "Starling", "Vine",
];

/** Deterministic display name from a random session id. */
export function displayNameFromId(sid: string): string {
  const h = createHash("sha256").update(`ddog-name:${sid}`).digest();
  const adj = ADJECTIVES[h[0] % ADJECTIVES.length];
  const noun = NOUNS[h[1] % NOUNS.length];
  const num = ((h[2] << 8) | h[3]) % 10000;
  return `${adj} ${noun} ${num.toString().padStart(4, "0")}`;
}

/**
 * Reads the session id from cookies (server components / route handlers).
 * Returns null when the visitor has no cookie yet — middleware normally
 * guarantees one exists before render.
 */
export async function getSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Ensures the DB row exists for this anonymous id (lazy upsert — the cookie is
 * minted in middleware, the row materializes on first API touch).
 */
export async function ensureSession(sid: string) {
  return db.anonSession.upsert({
    where: { id: sid },
    update: { lastSeenAt: new Date() },
    create: { id: sid, displayName: displayNameFromId(sid) },
  });
}

/** Convenience for route handlers: id + ensured row (or null when no cookie). */
export async function requireSession(): Promise<{ id: string; name: string } | null> {
  const sid = await getSessionId();
  if (!sid) return null;
  const row = await ensureSession(sid);
  return { id: row.id, name: row.displayName };
}

/** Hash an IP for rate limiting only — never persisted, never logged. */
export function hashIp(ip: string | null): string {
  return createHash("sha256")
    .update(`ddog-ip:${ip || "unknown"}`)
    .digest("hex")
    .slice(0, 32);
}

export function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}
