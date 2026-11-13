/**
 * Seed script — idempotent. Run: `npm run db:seed` (or `bun prisma/seed.ts`)
 *
 * Fills: original tracks + playlist, anonymous seed sessions, 12 sample posts
 * across all 5 categories + comments + local embeddings, sample cached counsel
 * responses, moderation logs, and usage stats.
 *
 * Daily content needs NO seeding: the Verse and Parable of the Day rotate
 * deterministically through curated Scripture banks (src/lib/daily.ts +
 * src/lib/parables-bank.ts) — no AI, no database rows involved.
 */
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";
import type * as DummyDataTypes from "../src/lib/dummy-data";

const require = createRequire(import.meta.url);
const {
  DUMMY_CACHED_RESPONSES,
  DUMMY_MODERATION_LOGS,
  DUMMY_PLAYLIST,
  DUMMY_POSTS,
  DUMMY_SESSIONS,
  DUMMY_TRACKS,
  DUMMY_USAGE_STATS,
  computeLocalEmbedding,
} = require("../src/lib/dummy-data.ts") as typeof DummyDataTypes;

const db = new PrismaClient();

async function main() {
  console.log("Seeding Daily Dose of Gospels…");

  // ── Tracks + playlist ────────────────────────────────────────────────────
  const playlist = await db.playlist.upsert({
    where: { name: DUMMY_PLAYLIST.name },
    update: {},
    create: { name: DUMMY_PLAYLIST.name, description: DUMMY_PLAYLIST.description },
  });

  let order = await db.track.count();
  for (const t of DUMMY_TRACKS) {
    const existing = await db.track.findFirst({ where: { audioUrl: t.audioUrl } });
    if (!existing) {
      const created = await db.track.create({
        data: {
          title: t.title,
          album: t.album,
          audioUrl: t.audioUrl,
          coverUrl: t.coverUrl,
          durationSec: t.durationSec,
          playCount: t.playCount,
          scripture: t.scripture,
          description: t.description,
          lyrics: t.lyrics,
          trackOrder: order,
          published: true,
        },
      });
      await db.playlistItem.create({
        data: { playlistId: playlist.id, trackId: created.id, position: order },
      });
      order += 1;
      console.log(`  + track ${created.title}`);
    }
  }

  // ── Anonymous seed sessions ──────────────────────────────────────────────
  for (const s of DUMMY_SESSIONS) {
    await db.anonSession.upsert({
      where: { id: s.id },
      update: {},
      create: { id: s.id, displayName: s.displayName },
    });
  }

  // ── Sample posts + comments + embeddings ─────────────────────────────────
  const now = Date.now();
  for (const p of DUMMY_POSTS) {
    const existing = await db.post.findFirst({ where: { title: p.title } });
    if (existing) continue;

    const createdAt = new Date(now - p.hoursAgo * 3600 * 1000);
    const post = await db.post.create({
      data: {
        sessionId: p.sessionId,
        category: p.category,
        title: p.title,
        body: p.body,
        sameSituation: p.sameSituation,
        encouraged: p.encouraged,
        crisisFlag: Boolean(p.crisisFlag),
        hidden: Boolean(p.hidden),
        createdAt,
        updatedAt: createdAt,
      },
    });

    for (const c of p.comments) {
      await db.comment.create({
        data: {
          postId: post.id,
          sessionId: c.sessionId,
          body: c.body,
          createdAt: new Date(now - c.hoursAgo * 3600 * 1000),
        },
      });
    }

    const vec = computeLocalEmbedding(`${p.title}\n${p.body}`);
    await db.postEmbedding.create({
      data: {
        postId: post.id,
        dim: vec.length,
        embedding: JSON.stringify(vec),
        model: "local-hash-v1",
      },
    });

    console.log(`  + post "${post.title}"`);
  }

  // ── Sample cached counselor responses ────────────────────────────────────
  for (const c of DUMMY_CACHED_RESPONSES) {
    const existing = await db.cachedResponse.findFirst({ where: { normalized: c.normalized } });
    if (existing) continue;
    const vec = computeLocalEmbedding(c.normalized);
    await db.cachedResponse.create({
      data: {
        normalized: c.normalized,
        dim: vec.length,
        embedding: JSON.stringify(vec),
        model: "local-hash-v1",
        response: c.response,
        language: c.language,
        themeTags: JSON.stringify(c.themeTags),
        hits: c.hits,
        qualityScore: c.qualityScore,
        votes: c.votes,
      },
    });
  }

  // ── Usage stats & moderation logs ────────────────────────────────────────
  for (const [key, value] of Object.entries(DUMMY_USAGE_STATS)) {
    await db.usageStat.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  const modCount = await db.moderationLog.count();
  if (modCount === 0) {
    for (const m of DUMMY_MODERATION_LOGS) {
      await db.moderationLog.create({
        data: {
          targetType: m.targetType,
          targetId: m.targetId,
          action: m.action,
          scores: m.scores,
          reason: m.reason,
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
