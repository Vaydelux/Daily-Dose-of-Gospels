import { NextResponse } from "next/server";
import { fetchTranslations } from "@/lib/bible";

export const dynamic = "force-dynamic";

/**
 * GET /api/bible/translations
 * Proxy for bible-api.com /data — the live translation catalogue.
 * 7-day upstream cache; falls back to an embedded list offline.
 */
export async function GET() {
  const translations = await fetchTranslations();
  return NextResponse.json(
    { translations },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" } },
  );
}
