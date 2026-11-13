import { NextRequest, NextResponse } from "next/server";
import { fetchRandom } from "@/lib/bible";

export const dynamic = "force-dynamic";

/**
 * GET /api/bible/random?translation=kjv
 * Proxy for the bible-api.com random-verse endpoint, restricted to a curated
 * set of well-loved books (per the API's own tip). Uncached — every visit is
 * a fresh verse; on upstream failure a KJV treasury verse is served instead.
 */
export async function GET(req: NextRequest) {
  const translation = req.nextUrl.searchParams.get("translation")?.trim() || "kjv";
  const data = await fetchRandom(translation);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
