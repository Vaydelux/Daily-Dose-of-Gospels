import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { feedbackSchema } from "@/lib/validators";
import { rateCachedResponse } from "@/lib/cache";

export const dynamic = "force-dynamic";

/** POST /api/counsel/feedback — thumbs up/down on cached counsel (quality score). */
export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Session unavailable" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
  }

  await rateCachedResponse(parsed.data.cachedResponseId, parsed.data.vote);
  return NextResponse.json({ ok: true });
}
