import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession, hashIp, clientIp } from "@/lib/session";
import { createCommentSchema } from "@/lib/validators";
import { scrubPII } from "@/lib/pii";
import { moderate } from "@/lib/moderation";
import { hit, isDuplicate } from "@/lib/ratelimit";
import { crisisBannerForContext } from "@/lib/crisis";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/posts/[id]/comments — anonymous reply (PII scrub → moderation). */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Session unavailable — please refresh." }, { status: 400 });
  }

  const post = await db.post.findUnique({ where: { id }, select: { id: true, hidden: true } });
  if (!post || post.hidden) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const ipHash = hashIp(clientIp(req));
  if (!hit(`comment:ip:${ipHash}`, 20, 60 * 60 * 1000).ok) {
    return NextResponse.json({ error: "A lot of replies in a short while — please pause and return shortly." }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = createCommentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Please check your reply." }, { status: 400 });
  }

  if (isDuplicate(`comment:${session.id}:${parsed.data.body.slice(0, 80)}`)) {
    return NextResponse.json({ error: "That reply is already on its way." }, { status: 409 });
  }

  const cleanBody = scrubPII(parsed.data.body);
  const verdict = await moderate("comment", "pending", cleanBody);

  const comment = await db.comment.create({
    data: {
      postId: id,
      sessionId: session.id,
      body: cleanBody,
      crisisFlag: verdict.action === "crisis",
      hidden: verdict.action === "hide",
    },
    include: { author: { select: { displayName: true } } },
  });

  await db.moderationLog.updateMany({
    where: { targetType: "comment", targetId: "pending" },
    data: { targetId: comment.id },
  });

  return NextResponse.json({
    comment: {
      id: comment.id,
      body: comment.body,
      crisisFlag: comment.crisisFlag,
      hidden: comment.hidden,
      createdAt: comment.createdAt,
      authorName: comment.author.displayName,
      mine: true,
    },
    moderation: verdict.action,
    crisis: verdict.action === "crisis" ? crisisBannerForContext("forum") : null,
  });
}
