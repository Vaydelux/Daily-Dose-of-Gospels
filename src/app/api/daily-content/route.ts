import { NextResponse } from "next/server";
import { getDailyContent } from "@/lib/daily";

export const dynamic = "force-dynamic";

/**
 * Public endpoint for the day's verse + parable (identical for every visitor).
 * Pure deterministic Scripture rotation — no AI, no database.
 */
export async function GET() {
  const content = getDailyContent();
  return NextResponse.json(content, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
