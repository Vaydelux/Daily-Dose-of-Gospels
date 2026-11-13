/**
 * Red-letter words of Christ — client-safe.
 *
 * Curated verse-range coverage following the tradition of printed
 * red-letter editions: everything the incarnate Christ speaks in the four
 * Gospels, plus His voice from heaven (which such editions also gild) and
 * His words to Saul and Ananias in Acts. Ranges are verse-level — where an
 * interlocutor's question falls inside a discourse, a stray verse may be
 * included, exactly as several printed editions do.
 *
 * Format per book: comma-separated tokens "ch:v" or "ch:v-ch:v" (the end
 * may span into a later chapter, e.g. the Sermon on the Mount "5:1-7:27").
 * Ranges are kept as spans and tested per verse — no materialized sets.
 */

const RANGES: Record<string, string> = {
  MAT: `3:15,3:17,4:4,4:7,4:10,
    5:3-7:27,
    8:10-8:12,9:2-9:6,9:12-9:13,9:15-9:17,
    10:5-10:42,11:4-11:30,
    12:11-12:13,12:25-12:32,12:36-12:37,12:43-12:45,12:48-12:50,
    13:3-13:52,
    14:27,14:31,
    15:3-15:9,15:11,15:13-15:14,15:16-15:20,15:24,15:26,15:28,
    16:2-16:4,16:6-16:11,16:17-16:19,16:21,16:24-16:27,
    17:5,17:7,17:9,17:11-17:12,17:17-17:20,17:26-17:27,
    18:3-18:20,18:22,18:23-18:35,
    19:4-19:9,19:11-19:12,19:14,19:17-19:19,19:21,19:23-19:24,19:26,19:28-19:30,
    20:22-20:23,20:25-20:28,20:32,
    21:2-21:3,21:13,21:16,21:21-21:22,21:24-21:27,21:28-21:44,
    22:9-22:14,22:18-22:21,22:29-22:32,22:37-22:40,22:44-22:45,
    23:2-23:39,24:4-24:51,25:1-25:46,
    26:2,26:10-26:13,26:18,26:21,26:23-26:24,26:26-26:29,26:31-26:32,26:34,
    26:36-26:38,26:40-26:41,26:45-26:46,26:50,26:52-26:54,26:63-26:64,
    27:11,27:46`,
  MRK: `1:11,1:15,1:17,1:25,1:38,1:41,1:44,
    2:5-2:11,2:17,2:19-2:22,
    3:4-3:5,3:23-3:29,3:33-3:35,
    4:3-4:32,4:35,4:39-4:41,
    5:8,5:19,5:34,
    6:4,6:8-6:11,6:31,6:37-6:38,6:50,
    7:6-7:16,7:18-7:23,
    8:5,8:12,8:15,8:17-8:21,8:29-8:30,
    9:1,9:7,9:12-9:13,9:19,9:23,9:25,9:29,
    10:3-10:9,10:11-10:12,10:14,10:18-10:19,10:21,10:23-10:27,10:29-10:31,
    10:33-10:34,10:38-10:40,10:42-10:45,10:49,10:52,
    11:2-11:3,11:14,11:17,11:22-11:24,11:29-11:30,
    12:6-12:11,12:15-12:17,12:24-12:27,12:29-12:31,12:34-12:37,
    13:2,13:5-13:37,
    14:6-14:9,14:14-14:15,14:18,14:20-14:25,14:27-14:28,14:30,14:36-14:38,
    14:41-14:42,14:48-14:49,14:61-14:62,
    15:2,15:34`,
  LUK: `2:49,3:22,
    4:4,4:8,4:12,4:18-4:27,
    5:10,5:14,5:20-5:24,5:31-5:32,5:34-5:39,
    6:3-6:5,6:8-6:10,6:20-6:49,
    7:9,7:22-7:28,7:31-7:35,7:40-7:50,
    8:11-8:15,8:21-8:22,8:24-8:25,8:30,8:39,8:45-8:48,8:50,8:54,
    9:3-9:5,9:13,9:20-9:22,9:23-9:27,9:35,9:41,9:44,9:47-9:48,9:55-9:56,9:58-9:62,
    10:2-10:24,
    11:2-11:13,11:17-11:36,11:39-11:52,
    12:2-12:12,12:14-12:53,
    13:2-13:9,13:12-13:21,13:24-13:35,
    14:5,14:10-14:24,14:26-14:35,
    15:4-15:32,
    16:1-16:13,16:15-16:31,
    17:1-17:10,17:14,17:17-17:19,17:22-17:37,
    18:6-18:8,18:14,18:16-18:17,18:19-18:20,18:22,18:24-18:25,18:27,18:29-18:33,18:41-18:42,
    19:5,19:9-19:10,19:11-19:27,19:40,19:42-19:44,19:46,
    20:3-20:4,20:8,20:9-20:18,20:24-20:26,20:34-20:38,20:41-20:47,
    21:3-21:4,21:6,21:8-21:36,
    22:8-22:12,22:15-22:22,22:25-22:32,22:34,22:36-22:38,22:40,22:42-22:44,22:46,
    22:48,22:51,22:53,22:67-22:70,
    23:3,23:28-23:31,23:34,23:43,
    24:36-24:49`,
  JHN: `1:47-1:51,
    2:4,2:7-2:8,2:16,2:19,
    3:3,3:5-3:8,3:10-3:21,
    4:10,4:13-4:14,4:16-4:18,4:21-4:26,4:32-4:38,4:48,4:50,
    5:6,5:8,5:14,5:17-5:47,
    6:5,6:10,6:20,6:26,6:29,6:32-6:33,6:35-6:40,6:43-6:51,6:53-6:58,6:61-6:65,6:67,6:70-6:71,
    7:6-7:8,7:16-7:24,7:28-7:29,7:33-7:38,
    8:12,8:14-8:30,8:31-8:36,8:39-8:58,
    9:3-9:5,9:7,9:35-9:41,
    10:1-10:18,10:25-10:30,10:32-10:38,
    11:4,11:9-11:11,11:14,11:23,11:25-11:26,11:34,11:39-11:40,
    12:7-12:8,12:23-12:32,12:35-12:36,12:44-12:50,
    13:7,13:10-13:11,13:12-13:20,13:21,13:26,13:31-13:33,13:36,13:38,
    14:1-14:31,15:1-15:27,16:1-16:28,16:31-16:33,17:1-17:26,
    18:5-18:6,18:8,18:11,18:20-18:21,18:23,18:34,18:36-18:37,
    19:9-19:11,19:26-19:27,19:28,19:30,
    20:15-20:17,20:19,20:21-20:23,20:26-20:29,
    21:5-21:6,21:10,21:12,21:15-21:19,21:22`,
  ACT: `1:4-1:5,1:7-1:8,
    9:4-9:6,9:15-9:16,
    22:7-22:10,22:17-22:21,23:11,26:14-26:18`,
};

type Span = { sc: number; sv: number; ec: number; ev: number };

const SPANS: Record<string, Span[]> = (() => {
  const out: Record<string, Span[]> = {};
  for (const [bookId, blob] of Object.entries(RANGES)) {
    const list: Span[] = [];
    for (const rawToken of blob.split(",")) {
      const token = rawToken.trim();
      if (!token) continue;
      const [rawStart, rawEnd] = token.split("-");
      if (!rawStart) continue;
      const startParts = rawStart.split(":").map(Number);
      if (startParts.length !== 2 || !startParts[0] || !startParts[1]) continue;
      const sc = startParts[0];
      const sv = startParts[1];
      let ec = sc;
      let ev = sv;
      if (rawEnd) {
        const endParts = rawEnd.split(":").map(Number);
        if (endParts.length === 2 && endParts[0] && endParts[1]) {
          ec = endParts[0];
          ev = endParts[1];
        } else if (endParts.length === 1 && endParts[0]) {
          ec = sc;
          ev = endParts[0];
        }
      }
      if (ec < sc || (ec === sc && ev < sv)) continue; // malformed — skip
      list.push({ sc, sv, ec, ev });
    }
    if (list.length) out[bookId] = list;
  }
  return out;
})();

/** True when the verse prints in crimson (with the red-letter setting on). */
export function isWordOfChrist(bookId: string, chapter: number, verse: number): boolean {
  const spans = SPANS[bookId.toUpperCase()];
  if (!spans) return false;
  for (let i = 0; i < spans.length; i++) {
    const s = spans[i];
    if (chapter < s.sc || chapter > s.ec) continue;
    if (chapter === s.sc && verse < s.sv) continue;
    if (chapter === s.ec && verse > s.ev) continue;
    return true;
  }
  return false;
}

/** Books that carry Christ's recorded words — drives the toolbar toggle. */
export const RED_LETTER_BOOKS = new Set(Object.keys(SPANS));
