import { NextResponse } from "next/server";
import { checkPassword, issueAdminCookie } from "@/lib/admin-auth";
import { hashIp, clientIp } from "@/lib/session";
import { hit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ipHash = hashIp(clientIp(req));
  if (!hit(`admin-login:${ipHash}`, 5, 15 * 60 * 1000).ok) {
    return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });
  }

  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.password || !checkPassword(body.password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  await issueAdminCookie();
  return NextResponse.json({ ok: true });
}
