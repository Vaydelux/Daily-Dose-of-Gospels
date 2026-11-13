import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { hit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/** POST /api/tracks/[id]/play — per-track play count (deduped per session/minute). */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession();

  if (session) {
    const limit = hit(`play:${session.id}:${id}`, 1, 60 * 1000);
    if (!limit.ok) {
      const track = await db.track.findUnique({ where: { id }, select: { playCount: true } });
      return NextResponse.json({ playCount: track?.playCount ?? 0 });
    }
  }

  const track = await db.track.update({
    where: { id },
    data: { playCount: { increment: 1 } },
    select: { playCount: true },
  }).catch(() => null);

  if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });
  return NextResponse.json({ playCount: track.playCount });
}
