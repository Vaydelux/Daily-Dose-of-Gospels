import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { embedOne, cosineSimilarity, isCompatibleModel } from "@/lib/embeddings";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Connection engine (spec 3.2): "Others walking through something similar."
 * Cosine similarity of post embeddings (app-code fallback path; pgvector notes
 * in schema). Returns top 3–5 similar posts, anonymous, excluding the viewer's
 * own. On the post page this renders with "You are not alone."
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();

  const target = await db.postEmbedding.findUnique({ where: { postId: id } });
  if (!target) {
    return NextResponse.json({ similar: [] });
  }
  if (!isCompatibleModel(target.model)) {
    return NextResponse.json({ similar: [] });
  }
  const targetVec = JSON.parse(target.embedding) as number[];

  const candidates = await db.postEmbedding.findMany({
    where: { postId: { not: id }, model: target.model, dim: targetVec.length },
    include: {
      post: {
        select: {
          id: true, title: true, body: true, category: true,
          sameSituation: true, encouraged: true, hidden: true, sessionId: true, createdAt: true,
        },
      },
    },
    take: 300,
    orderBy: { createdAt: "desc" },
  });

  const scored = candidates
    .filter((c) => !c.post.hidden && c.post.sessionId !== session?.id)
    .map((c) => ({ post: c.post, sim: cosineSimilarity(targetVec, JSON.parse(c.embedding) as number[]) }))
    .filter((c) => c.sim > 0.12)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 5);

  return NextResponse.json({
    similar: scored.map(({ post, sim }) => ({
      id: post.id,
      title: post.title,
      category: post.category,
      snippet: post.body.slice(0, 140),
      sameSituation: post.sameSituation,
      encouraged: post.encouraged,
      similarity: Math.round(sim * 100) / 100,
    })),
  });
}
