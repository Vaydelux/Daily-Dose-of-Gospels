import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/tracks — published tracks grouped client-side by album. */
export async function GET() {
  const tracks = await db.track.findMany({
    where: { published: true },
    orderBy: [{ album: "asc" }, { trackOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ tracks });
}
