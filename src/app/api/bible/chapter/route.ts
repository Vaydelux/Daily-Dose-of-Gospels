import { NextRequest, NextResponse } from "next/server";
import { BibleApiError, fetchChapter } from "@/lib/bible";

export const dynamic = "force-dynamic";

/**
 * GET /api/bible/chapter?book=JHN&chapter=3&translation=kjv
 * Proxy for the bible-api.com Parameterized API — 30-day upstream cache.
 */
export async function GET(req: NextRequest) {
  const book = (req.nextUrl.searchParams.get("book") ?? "").trim().toUpperCase();
  const chapter = Number(req.nextUrl.searchParams.get("chapter"));
  const translation = req.nextUrl.searchParams.get("translation")?.trim() || "kjv";

  if (!book || !Number.isInteger(chapter)) {
    return NextResponse.json({ error: "Missing book or chapter — try /api/bible/chapter?book=JHN&chapter=3" }, { status: 400 });
  }

  try {
    const data = await fetchChapter(book, chapter, translation);
    return NextResponse.json(data, {
      // Chapter text is immutable — let the browser and CDNs keep it forever.
      headers: { "Cache-Control": "public, max-age=31536000, immutable, stale-while-revalidate=86400" },
    });
  } catch (e) {
    const status = e instanceof BibleApiError ? e.status : 502;
    const message =
      status === 400
        ? "That book or chapter is out of range."
        : status === 429
          ? "The Bible API is resting for a moment (rate limit). Please try again shortly."
          : "The Bible API could not be reached. Please try again in a moment.";
    return NextResponse.json({ error: message, status }, { status: status === 400 ? 400 : 502 });
  }
}
