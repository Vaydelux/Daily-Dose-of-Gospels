import "server-only";

/**
 * Quick PII scrub, applied BEFORE anything is saved to the database
 * (posts, comments, chat messages, cache entries).
 *
 * Conservative by design: we remove obvious identifiers (emails, phones,
 * URLs, social handles, self-introductions) rather than attempt named-entity
 * recognition. Replacements are marked [private] so readers know text was
 * redacted, not lost.
 */

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}\b/g;
const URL = /https?:\/\/\S+|www\.\S+/gi;
const HANDLE = /(?:^|\s)@[a-z0-9_]{3,30}\b/gi;
const SELF_NAME =
  /\b(?:my name is|i am called|you can call me|this is)\s+[A-Z][a-zA-Z\u00C0-\u024F]+(?:\s+[A-Z][a-zA-Z\u00C0-\u024F]+)?/g;
const ADDRESS = /\b\d{1,5}\s+[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*\s(?:Street|St|Avenue|Ave|Road|Rd|Blvd|Boulevard|Lane|Ln|Drive|Dr)\b/g;

/** Length guard: collapse obvious digit-runs that are not phone-like. */
const LONG_NUMBERS = /\b\d{7,}\b/g;

export function scrubPII(text: string): string {
  let out = text ?? "";
  out = out.replace(EMAIL, "[private]");
  out = out.replace(ADDRESS, "[private]");
  out = out.replace(URL, "[link removed]");
  out = out.replace(HANDLE, (m) => (m.startsWith(" ") ? " @[hidden]" : "@[hidden]"));
  out = out.replace(PHONE, (m) => (m.replace(/\D/g, "").length >= 7 ? "[private]" : m));
  out = out.replace(SELF_NAME, (m) => {
    const kept = /this is/i.test(m) ? m : m.split(/\s/)[0];
    return `${kept} [private]`;
  });
  out = out.replace(LONG_NUMBERS, "[private]");
  return out.replace(/\s{3,}/g, "  ").trim();
}

/**
 * Normalization for the semantic cache: lowercase, scrub PII, collapse
 * whitespace, strip punctuation noise. Two people asking the same thing in
 * different words should land close together; the same person twice should
 * land identically.
 */
export function normalizeForCache(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .replace(EMAIL, " ")
    .replace(URL, " ")
    .replace(PHONE, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
