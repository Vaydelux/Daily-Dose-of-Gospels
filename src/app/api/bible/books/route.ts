import { NextRequest, NextResponse } from "next/server";
import { fetchBooks } from "@/lib/bible";

export const dynamic = "force-dynamic";

/**
 * GET /api/bible/books?translation=kjv
 * Proxy for the bible-api.com Parameterized API book list, merged with
 * standard chapter counts. 30-day upstream cache, embedded fallback.
 */
export async function GET(req: NextRequest) {
  const translation = req.nextUrl.searchParams.get("translation")?.trim() || "kjv";
  const books = await fetchBooks(translation);
  return NextResponse.json(
    { translation, books },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400" } },
  );
}
