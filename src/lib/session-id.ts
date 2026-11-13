/**
 * Edge-safe session id generation (no Node imports — usable in middleware).
 */
export const SESSION_COOKIE = "ddog_sid";

export function newSessionId(): string {
  const c = globalThis.crypto;
  return (
    c.randomUUID().replace(/-/g, "") +
    c.randomUUID().replace(/-/g, "")
  );
}
