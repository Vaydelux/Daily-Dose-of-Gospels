import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getMemory, renderMemory, clearMemory } from "@/lib/memory";

export const dynamic = "force-dynamic";

/** GET /api/counsel/memory — what the counselor remembers (no PII, ever). */
export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ memory: null, rendered: "" });
  const memory = await getMemory(session.id);
  const hasMemory = memory.themes.length > 0 || memory.concerns.length > 0 || memory.notes.length > 0 || memory.prayed;
  return NextResponse.json({
    memory: hasMemory ? memory : null,
    rendered: hasMemory ? renderMemory(memory) : "",
  });
}

/** DELETE /api/counsel/memory — "Clear my memory": permanent, per spec. */
export async function DELETE() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ ok: true });
  await clearMemory(session.id);
  return NextResponse.json({ ok: true });
}
