import { NextRequest, NextResponse } from "next/server";
import { BibleApiError, fetchPassage } from "@/lib/bible";

export const dynamic = "force-dynamic";

/**
 * GET /api/bible/passage?ref=john+3:16&translation=kjv
 * Proxy for the bible-api.com User Input API — 30-day upstream cache.
 */
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref")?.trim() ?? "";
  const translation = req.nextUrl.searchParams.get("translation")?.trim() || "kjv";

  if (!ref) {
    return NextResponse.json({ error: "Missing ref — try /api/bible/passage?ref=john 3:16" }, { status: 400 });
  }

  try {
    const data = await fetchPassage(ref, translation);
    return NextResponse.json(data, {
      // Verse text never changes — cache it in the browser indefinitely too.
      headers: { "Cache-Control": "public, max-age=31536000, immutable, stale-while-revalidate=86400" },
    });
  } catch (e) {
    const status = e instanceof BibleApiError ? e.status : 502;
    const message =
      status === 404
        ? `Could not find "${ref}". Check the book name, chapter and verse.`
        : status === 429
          ? "The Bible API is resting for a moment (rate limit). Please try again shortly."
          : "The Bible API could not be reached. Please try again in a moment.";
    const detail = e instanceof Error ? e.message : undefined;
    return NextResponse.json(
      { error: message, status, detail: status >= 500 ? detail : undefined },
      { status: status === 400 || status === 404 ? 404 : 502 },
    );
  }
}
