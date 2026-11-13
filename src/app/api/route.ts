import { NextResponse } from "next/server";

/**
 * GET /api — liveness probe for uptime checks and the admin dashboard.
 * No state, no DB touch: answers the narrow question "is the app up?".
 */
export async function GET() {
  return NextResponse.json(
    { ok: true, service: "daily-dose-of-gospels", time: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
