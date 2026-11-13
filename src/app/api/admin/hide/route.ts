import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** POST /api/admin/hide — toggle hidden state of a post or comment. */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { targetType?: string; targetId?: string; hidden?: boolean };
  try {
    body = (await req.json()) as { targetType?: string; targetId?: string; hidden?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.targetId || typeof body.hidden !== "boolean") {
    return NextResponse.json({ error: "targetId and hidden are required" }, { status: 400 });
  }

  if (body.targetType === "post") {
    const row = await db.post.update({ where: { id: body.targetId }, data: { hidden: body.hidden } });
    return NextResponse.json({ ok: true, hidden: row.hidden });
  }
  if (body.targetType === "comment") {
    const row = await db.comment.update({ where: { id: body.targetId }, data: { hidden: body.hidden } });
    return NextResponse.json({ ok: true, hidden: row.hidden });
  }
  return NextResponse.json({ error: "Unknown targetType" }, { status: 400 });
}
