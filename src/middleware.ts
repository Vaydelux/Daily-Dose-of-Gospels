import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, newSessionId } from "@/lib/session-id";

/**
 * Middleware: guarantees every visitor carries an anonymous session cookie
 * before any page or API runs. The cookie value is a random token minted here
 * (edge-safe); the matching DB row is created lazily by `ensureSession`.
 * No IP, fingerprint, or PII is read or stored.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  if (!req.cookies.get(SESSION_COOKIE)?.value) {
    const sid = newSessionId();
    res.cookies.set(SESSION_COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365, // one year
      path: "/",
    });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|music/|covers/|uploads/).*)"],
};
