import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Returns this visitor's anonymous display name (e.g. "Faithful Sparrow 4821").
 * Creates the session row on first touch. No PII in, no PII out.
 */
export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ displayName: null }, { status: 200 });
  }
  return NextResponse.json({ displayName: session.name });
}
