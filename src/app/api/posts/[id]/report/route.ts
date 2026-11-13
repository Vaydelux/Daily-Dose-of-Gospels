import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { reportSchema } from "@/lib/validators";
import { AUTO_HIDE_REPORT_THRESHOLD } from "@/lib/prompts";

export const dynamic = "force-dynamic";

/**
 * POST /api/posts/[id]/report — community flagging.
 * After N reports the post auto-hides pending admin review.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Session unavailable — please refresh." }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please tell us briefly what's wrong." }, { status: 400 });
  }

  const { reason, commentId } = parsed.data;

  if (commentId) {
    const comment = await db.comment.findUnique({ where: { id: commentId }, select: { id: true, postId: true, hidden: true } });
    if (!comment || comment.postId !== id) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    await db.report.create({ data: { postId: id, commentId, sessionId: session.id, reason } });
    const count = await db.report.count({ where: { commentId } });
    if (count >= AUTO_HIDE_REPORT_THRESHOLD) {
      await db.comment.update({ where: { id: commentId }, data: { hidden: true, reportCount: count } });
    } else {
      await db.comment.update({ where: { id: commentId }, data: { reportCount: count } });
    }
    const hidden = count >= AUTO_HIDE_REPORT_THRESHOLD;
    return NextResponse.json({ ok: true, hidden, message: hidden ? "Thank you — this reply has been hidden for review." : "Thank you — our team will take a look." });
  }

  const post = await db.post.findUnique({ where: { id }, select: { id: true, hidden: true } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  await db.report.create({ data: { postId: id, sessionId: session.id, reason } });
  const count = await db.report.count({ where: { postId: id } });
  await db.post.update({ where: { id }, data: { reportCount: count, hidden: count >= AUTO_HIDE_REPORT_THRESHOLD ? true : undefined } });

  const hidden = count >= AUTO_HIDE_REPORT_THRESHOLD;
  return NextResponse.json({ ok: true, hidden, message: hidden ? "Thank you — this post has been hidden for review." : "Thank you — our team will take a look." });
}
