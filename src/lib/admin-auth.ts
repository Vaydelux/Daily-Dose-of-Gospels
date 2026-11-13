import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Admin gate: single env password (ADMIN_PASSWORD) → signed HTTP-only cookie.
 * Fails closed in production if ADMIN_PASSWORD is not configured.
 */

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ||
  (process.env.NODE_ENV === "production" ? "" : "admin-dev-password");
const COOKIE_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function sign(secret: string): string {
  const issued = Date.now();
  const mac = createHmac("sha256", secret).update(`admin:${issued}`).digest("hex");
  return `${issued}.${mac}`;
}

function verify(token: string | undefined): boolean {
  if (!ADMIN_PASSWORD || !token) return false;
  const [issuedStr, mac] = token.split(".");
  const issued = Number(issuedStr);
  if (!issued || !mac || Date.now() - issued > COOKIE_TTL_MS) return false;
  const expected = createHmac("sha256", ADMIN_PASSWORD).update(`admin:${issued}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function checkPassword(input: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  const a = Buffer.from(input ?? "");
  const b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function issueAdminCookie() {
  if (!ADMIN_PASSWORD) return;
  const store = await cookies();
  store.set("ddog_admin", sign(ADMIN_PASSWORD), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_TTL_MS / 1000,
    path: "/",
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.set("ddog_admin", "", { httpOnly: true, maxAge: 0, path: "/" });
}

export async function isAdmin(): Promise<boolean> {
  if (!ADMIN_PASSWORD) return false;
  const store = await cookies();
  return verify(store.get("ddog_admin")?.value);
}
