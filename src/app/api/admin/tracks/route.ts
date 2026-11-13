import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { trackSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** POST /api/admin/tracks — publish a track (audio/cover already uploaded). */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = trackSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check the track fields" }, { status: 400 });
  }

  const data = parsed.data;
  const count = await db.track.count();
  const track = await db.track.create({
    data: {
      title: data.title,
      description: data.description,
      lyrics: data.lyrics,
      scripture: data.scripture,
      album: data.album || "Singles",
      audioUrl: data.audioUrl,
      coverUrl: data.coverUrl,
      durationSec: data.durationSec,
      trackOrder: count,
      published: true,
    },
  });

  revalidatePath("/", "layout");
  return NextResponse.json({ track });
}

/** GET /api/admin/tracks — full list incl. unpublished (admin). */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tracks = await db.track.findMany({ orderBy: [{ album: "asc" }, { trackOrder: "asc" }] });
  return NextResponse.json({ tracks });
}
