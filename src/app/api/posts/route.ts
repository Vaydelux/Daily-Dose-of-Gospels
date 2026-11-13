import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession, hashIp, clientIp } from "@/lib/session";
import { createPostSchema } from "@/lib/validators";
import { scrubPII } from "@/lib/pii";
import { moderate } from "@/lib/moderation";
import { hit, isDuplicate } from "@/lib/ratelimit";
import { embedOne } from "@/lib/embeddings";
import { crisisBannerForContext } from "@/lib/crisis";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/posts?category=TESTIMONY&cursor=... — anonymous list. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const take = Math.min(Number(url.searchParams.get("take") || 20), 50);
  const cursor = url.searchParams.get("cursor") || undefined;

  const posts = await db.post.findMany({
    where: {
      hidden: false,
      ...(category && category !== "ALL" ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      _count: { select: { comments: { where: { hidden: false } } } },
    },
  });

  const hasMore = posts.length > take;
  const page = hasMore ? posts.slice(0, take) : posts;

  return NextResponse.json({
    posts: page.map((p) => ({
      id: p.id,
      category: p.category,
      title: p.title,
      body: p.body,
      sameSituation: p.sameSituation,
      encouraged: p.encouraged,
      crisisFlag: p.crisisFlag,
      commentCount: p._count.comments,
      createdAt: p.createdAt,
      mine: false, // filled client-side against /api/session when needed
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
}

/** POST /api/posts — create an anonymous post (PII scrub → moderation → embed). */
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Session unavailable — please refresh." }, { status: 400 });
  }

  const ipHash = hashIp(clientIp(req));
  const perIp = hit(`post:ip:${ipHash}`, 10, 60 * 60 * 1000);
  const perSession = hit(`post:session:${session.id}`, 6, 60 * 60 * 1000);
  if (!perIp.ok || !perSession.ok) {
    return NextResponse.json(
      { error: "You've shared quite a bit just now — take a breath, and try again a little later." },
      { status: 429 }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = createPostSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Please check your post." },
      { status: 400 }
    );
  }

  if (isDuplicate(`post:${session.id}:${parsed.data.title}:${parsed.data.body.slice(0, 80)}`)) {
    return NextResponse.json({ error: "That post is already on its way." }, { status: 409 });
  }

  const cleanTitle = scrubPII(parsed.data.title);
  const cleanBody = scrubPII(parsed.data.body);

  const verdict = await moderate("post", "pending", `${cleanTitle}\n${cleanBody}`);

  const post = await db.post.create({
    data: {
      sessionId: session.id,
      category: parsed.data.category,
      title: cleanTitle,
      body: cleanBody,
      crisisFlag: verdict.action === "crisis",
      hidden: verdict.action === "hide",
    },
  });

  // Attach the moderation verdict to the real post id now that it exists.
  await db.moderationLog.updateMany({
    where: { targetType: "post", targetId: "pending" },
    data: { targetId: post.id },
  });

  // Embedding for the connection engine (best-effort).
  try {
    const { vec, dim, model } = await embedOne(`${cleanTitle}\n${cleanBody}`.slice(0, 2000));
    if (vec?.length) {
      await db.postEmbedding.create({
        data: { postId: post.id, dim, embedding: JSON.stringify(vec), model },
      });
    }
  } catch {
    // connection engine is optional at write time
  }

  return NextResponse.json({
    post: { id: post.id, crisisFlag: post.crisisFlag, hidden: post.hidden },
    moderation: verdict.action,
    crisis: verdict.action === "crisis" ? crisisBannerForContext("forum") : null,
  });
}
