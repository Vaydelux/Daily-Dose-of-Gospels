import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/posts/[id] — full post detail with visible comments and viewer's reactions. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();

  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: { select: { displayName: true } },
      _count: { select: { comments: { where: { hidden: false } } } },
    },
  });

  if (!post || (post.hidden && post.sessionId !== session?.id)) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const comments = await db.comment.findMany({
    where: { postId: id, hidden: false },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { displayName: true } } },
  });

  const myReactions = session
    ? await db.reaction.findMany({ where: { postId: id, sessionId: session.id } })
    : [];

  return NextResponse.json({
    post: {
      id: post.id,
      category: post.category,
      title: post.title,
      body: post.body,
      crisisFlag: post.crisisFlag,
      sameSituation: post.sameSituation,
      encouraged: post.encouraged,
      createdAt: post.createdAt,
      authorName: post.author.displayName,
      commentCount: post._count.comments,
      mine: session ? post.sessionId === session.id : false,
    },
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      crisisFlag: c.crisisFlag,
      createdAt: c.createdAt,
      authorName: c.author.displayName,
      mine: session ? c.sessionId === session.id : false,
    })),
    myReactions: myReactions.map((r) => r.type),
  });
}
