/**
 * Client-safe crisis-response copy (no server imports).
 * Used by server routes (via lib/crisis.ts) and client components directly.
 * Never a dead end: real-world help first, then prayer, then community.
 */
export const CRISIS_BANNER = {
  title: "Please reach out — you matter, and you are not alone.",
  body: `What you shared tells us you are carrying something far too heavy to carry alone. Please contact your local emergency number right now, or reach a trusted person — a family member, a friend, a pastor, a doctor — and stay with them.

If you are in the Philippines, you can call:
- NCMH Crisis Hotline: 1553 (toll-free, 24/7) or (02) 8531-9001
- Emergency: 911
Elsewhere, findahelpline.com lists a free, confidential line for your country.

Jesus sees you (Mark 6:34). We do too — and we are praying with you.`,
  verse: "The LORD is close to the brokenhearted and saves those who are crushed in spirit.",
  verseRef: "Psalm 34:18",
} as const;

export const CHAT_CRISIS = `Before anything else: please contact your local emergency number or a crisis line right now, and reach a trusted person who can be with you. In the Philippines: NCMH 1553 (toll-free) or 911; elsewhere: findahelpline.com.

I am here, and God is near to the brokenhearted (Psalm 34:18). If you would like, we can pray together right now — but please make that call first.` as const;
