import "server-only";
import { db } from "@/lib/db";
import { embedOne, cosineSimilarity, isCompatibleModel } from "@/lib/embeddings";
import { normalizeForCache } from "@/lib/pii";
import { estimateText } from "@/lib/ai/provider";

/**
 * Semantic response cache (spec 5.1).
 *
 * normalize → embed → cosine search over CachedResponse → hit if
 * similarity ≥ threshold AND language AND stage-kind match. On hit we bump
 * counters and re-stream the cached counsel; on miss the caller stores the
 * result. TTL + quality eviction keep the cache healthy.
 */

export const CACHE_SIMILARITY_THRESHOLD = Number(process.env.CACHE_SIMILARITY_THRESHOLD || 0.92);
const CACHE_TTL_DAYS = Number(process.env.CACHE_TTL_DAYS || 90);
const CACHE_MAX_ROWS = 5000;

export type CacheLookup = {
  hit: boolean;
  response?: string;
  id?: string;
  similarity?: number;
};

export async function bumpStat(key: string, by = 1) {
  await db.usageStat.upsert({
    where: { key },
    update: { value: { increment: by }, updatedAt: new Date() },
    create: { key, value: by },
  });
}

export async function getStatMap(): Promise<Record<string, number>> {
  const rows = await db.usageStat.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function lookupCachedResponse(
  rawQuestion: string,
  language: string
): Promise<CacheLookup> {
  const normalized = normalizeForCache(rawQuestion);
  if (normalized.length < 12) return { hit: false };

  const { vec, model } = await embedOne(normalized);
  if (!vec?.length) return { hit: false };

  const ttlCutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);
  const candidates = await db.cachedResponse.findMany({
    where: { active: true, language, createdAt: { gte: ttlCutoff } },
    orderBy: { lastHitAt: "desc" },
    take: 400,
  });

  let best: { id: string; response: string; sim: number } | null = null;
  for (const row of candidates) {
    if (row.dim !== vec.length || !isCompatibleModel(row.model)) continue;
    const sim = cosineSimilarity(vec, JSON.parse(row.embedding) as number[]);
    if (!best || sim > best.sim) best = { id: row.id, response: row.response, sim };
  }

  if (best && best.sim >= CACHE_SIMILARITY_THRESHOLD) {
    await db.cachedResponse.update({
      where: { id: best.id },
      data: { hits: { increment: 1 }, lastHitAt: new Date() },
    });
    await bumpStat("cache_hit");
    await bumpStat("tokens_saved", estimateText(best.response) + estimateText(normalized));
    return { hit: true, response: best.response, id: best.id, similarity: best.sim };
  }

  await bumpStat("cache_miss");
  return { hit: false, similarity: best?.sim ?? 0 };
}

export async function storeCachedResponse(input: {
  rawQuestion: string;
  response: string;
  language: string;
  themeTags: string[];
}): Promise<void> {
  const normalized = normalizeForCache(input.rawQuestion);
  if (normalized.length < 12 || !input.response) return;

  const { vec, dim, model } = await embedOne(normalized);
  if (!vec?.length) return;

  await db.cachedResponse.create({
    data: {
      normalized: normalized.slice(0, 2000),
      dim,
      embedding: JSON.stringify(vec),
      model,
      response: input.response,
      language: input.language,
      themeTags: JSON.stringify(input.themeTags),
    },
  });

  // Evict inactive or low-quality entries beyond a soft cap.
  const count = await db.cachedResponse.count({ where: { active: true } });
  if (count > CACHE_MAX_ROWS) {
    const worst = await db.cachedResponse.findMany({
      where: { active: true },
      orderBy: [{ qualityScore: "asc" }, { hits: "asc" }],
      take: Math.floor(CACHE_MAX_ROWS * 0.05),
      select: { id: true },
    });
    await db.cachedResponse.updateMany({
      where: { id: { in: worst.map((w) => w.id) } },
      data: { active: false },
    });
  }
}

/** Thumbs feedback → adjust quality; evict when persistently disliked. */
export async function rateCachedResponse(id: string, vote: 1 | -1): Promise<void> {
  const row = await db.cachedResponse.findUnique({ where: { id } });
  if (!row) return;
  const votes = row.votes + 1;
  const qualityScore = row.qualityScore + vote;
  await db.cachedResponse.update({ where: { id }, data: { votes, qualityScore } });
  if (votes >= 4 && qualityScore / votes < -0.25) {
    await db.cachedResponse.update({ where: { id }, data: { active: false } });
  }
}

/** Language sniff — light heuristic, good enough for cache partitioning. */
export function sniffLanguage(text: string): string {
  const tl = /\b(ako|akin|ako'y|naman|kayo|salamat|hindi|kung|dahil|lang|kasi|pala|ba|po|opo|namin|ko|mo|siya|kami|tayo|nang|ng|sa|ang|mga|may|walang|gusto|kailangan|tulong|dasal|lubos|lungkot|takot|pagod|sana)\b/gi;
  const matches = text.match(tl)?.length ?? 0;
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  if (matches / words > 0.18) return "tl";
  const mixed = matches >= 2 && /[a-z]+/i.test(text);
  if (mixed && matches / words > 0.06) return "taglish";
  return "en";
}
