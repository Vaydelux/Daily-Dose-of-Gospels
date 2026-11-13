import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { reactionTypeSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * POST /api/posts/[id]/reactions — toggle SAME_SITUATION or ENCOURAGED.
 * One reaction of each type per session; toggling removes it.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Session unavailable — please refresh." }, { status: 400 });
  }

  let payload: { type?: string };
  try {
    payload = (await req.json()) as { type?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = reactionTypeSchema.safeParse(payload.type);
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown reaction" }, { status: 400 });
  }
  const type = parsed.data;

  const post = await db.post.findUnique({ where: { id }, select: { id: true, hidden: true, sessionId: true } });
  if (!post || post.hidden) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const existing = await db.reaction.findUnique({
    where: { postId_sessionId_type: { postId: id, sessionId: session.id, type } },
  });

  let active: boolean;
  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } });
    await db.post.update({
      where: { id },
      data: type === "SAME_SITUATION" ? { sameSituation: { decrement: 1 } } : { encouraged: { decrement: 1 } },
    });
    active = false;
  } else {
    try {
      await db.reaction.create({ data: { postId: id, sessionId: session.id, type } });
    } catch {
      return NextResponse.json({ error: "Already reacted" }, { status: 409 });
    }
    await db.post.update({
      where: { id },
      data: type === "SAME_SITUATION" ? { sameSituation: { increment: 1 } } : { encouraged: { increment: 1 } },
    });
    active = true;
  }

  const fresh = await db.post.findUnique({ where: { id }, select: { sameSituation: true, encouraged: true } });
  return NextResponse.json({
    active,
    sameSituation: fresh?.sameSituation ?? 0,
    encouraged: fresh?.encouraged ?? 0,
  });
}
