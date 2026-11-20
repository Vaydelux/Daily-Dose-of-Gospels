import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { getStatMap } from "@/lib/cache";
import { getSearchAnalyticsSummary } from "@/lib/search-analytics";
import { aiBackend, chatModelName, embeddingModelName } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";

/** GET /api/admin/data — stats, flagged/hidden content, moderation log, cache health. */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [stats, searchInsights, hiddenPosts, flaggedComments, moderationLog, cacheRows, counts] = await Promise.all([
    getStatMap(),
    getSearchAnalyticsSummary(12),
    db.post.findMany({
      where: { OR: [{ hidden: true }, { reportCount: { gt: 0 } }, { crisisFlag: true }] },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { _count: { select: { reports: true } } },
    }),
    db.comment.findMany({
      where: { OR: [{ hidden: true }, { reportCount: { gt: 0 } }] },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.moderationLog.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
    db.cachedResponse.findMany({
      where: { active: true },
      orderBy: { lastHitAt: "desc" },
      take: 20,
      select: { id: true, normalized: true, language: true, hits: true, qualityScore: true, votes: true, createdAt: true },
    }),
    Promise.all([
      db.post.count({ where: { hidden: false } }),
      db.comment.count({ where: { hidden: false } }),
      db.conversation.count(),
      db.track.count(),
    ]),
  ]);

  return NextResponse.json({
    backend: { ai: aiBackend(), chatModel: chatModelName(), embeddingModel: embeddingModelName() },
    stats,
    counts: { posts: counts[0], comments: counts[1], conversations: counts[2], tracks: counts[3] },
    hiddenPosts: hiddenPosts.map((p) => ({
      id: p.id, title: p.title, category: p.category, hidden: p.hidden,
      crisisFlag: p.crisisFlag, reportCount: p.reportCount, reports: p._count.reports, createdAt: p.createdAt,
    })),
    flaggedComments: flaggedComments.map((c) => ({
      id: c.id, postId: c.postId, body: c.body.slice(0, 300), hidden: c.hidden, reportCount: c.reportCount, createdAt: c.createdAt,
    })),
    moderationLog,
    cacheRows,
    searchInsights,
  });
}
