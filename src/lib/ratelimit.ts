import "server-only";

/**
 * Sliding-window rate limiter.
 *
 * Default backend: in-memory Map (perfect for a single dev server; resets on
 * redeploy). The interface is intentionally tiny so an Upstash Redis backend
 * can replace `hit()` without touching call sites — see README ("Production
 * hardening") for the swap-in snippet.
 */

type Bucket = number[]; // timestamps of accepted hits

const globalForLimit = globalThis as unknown as {
  __ddogRateBuckets?: Map<string, Bucket>;
};
const buckets: Map<string, Bucket> = globalForLimit.__ddogRateBuckets ?? new Map();
globalForLimit.__ddogRateBuckets = buckets;

export type LimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

export function hit(key: string, limit: number, windowMs: number): LimitResult {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (arr.length >= limit) {
    const retryAfterMs = windowMs - (now - arr[0]);
    buckets.set(key, arr); // prune
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
  }

  arr.push(now);
  buckets.set(key, arr);

  // opportunistic GC so the map cannot grow unbounded
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }

  return { ok: true, remaining: limit - arr.length, retryAfterSec: 0 };
}

/** Cooldown check used after repeated off-topic chat attempts. */
export function isCoolingDown(key: string): number {
  const arr = (buckets.get(key) ?? []).filter((t) => Date.now() - t < 10 * 60 * 1000);
  if (arr.length === 0) return 0;
  return Math.ceil((10 * 60 * 1000 - (Date.now() - arr[0])) / 1000);
}

export function applyCooldown(key: string, windowMs: number) {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  buckets.set(key, arr);
}

export function clearCooldown(key: string) {
  buckets.delete(key);
}

/** Request de-duplication: true if this exact key was seen within `ms`. */
const recent = new Map<string, number>();
export function isDuplicate(key: string, ms = 4000): boolean {
  const now = Date.now();
  const last = recent.get(key) ?? 0;
  if (now - last < ms) return true;
  recent.set(key, now);
  if (recent.size > 10000) {
    for (const [k, t] of recent) if (now - t > 60000) recent.delete(k);
  }
  return false;
}
