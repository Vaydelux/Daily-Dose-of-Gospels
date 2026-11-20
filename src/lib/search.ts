import { BOOKS, type BibleBookMeta } from "./bible/books-meta";
import { THEMES, VERSES, type ThemeKey } from "./verses-bank";

export type BibleJumpHit = {
  bookId: string;
  bookName: string;
  chapter: number;
  verse?: number;
  label: string;
  href: string;
};

export type VerseSearchHit = {
  ref: string;
  text: string;
  theme: ThemeKey;
  themeLabel: string;
  href: string;
  versesHref: string;
};

export type PostSearchInput = {
  id: string;
  title: string;
  body: string;
  category: string;
  hidden?: boolean;
  sameSituation: number;
  encouraged: number;
  commentCount: number;
  createdAt: string | Date;
};

export type PostSearchHit = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  commentCount: number;
  href: string;
};

export type TrackSearchInput = {
  id: string;
  title: string;
  album: string;
  scripture: string;
  description: string;
  lyrics: string;
  coverUrl: string;
  audioUrl: string;
  durationSec: number;
  playCount: number;
  published?: boolean;
};

export type TrackSearchHit = {
  id: string;
  title: string;
  album: string;
  scripture: string;
  description: string;
  coverUrl: string;
  durationSec: number;
  href: string;
};

export type GlobalSearchResponse = {
  query: string;
  bibleJump: BibleJumpHit | null;
  verses: VerseSearchHit[];
  posts: PostSearchHit[];
  tracks: TrackSearchHit[];
  total: number;
};

export type HighlightSegment = {
  text: string;
  match: boolean;
};

export const CATEGORY_LABELS: Record<string, string> = {
  TESTIMONY: "Testimony",
  PRAYER: "Prayer Request",
  STRUGGLES: "Struggles",
  ENCOURAGEMENT: "Encouragement",
  REFLECTION: "Bible Reflection",
};

const THEME_BY_KEY = new Map(THEMES.map((t) => [t.key, t]));

/** Common book aliases & abbreviations -> canonical book ID. */
const BOOK_ALIASES: Record<string, string> = {
  gen: "GEN",
  ge: "GEN",
  ex: "EXO",
  exo: "EXO",
  exod: "EXO",
  lev: "LEV",
  num: "NUM",
  deut: "DEU",
  deu: "DEU",
  dt: "DEU",
  josh: "JOS",
  jos: "JOS",
  judg: "JDG",
  jdg: "JDG",
  ruth: "RUT",
  rut: "RUT",
  "1sam": "1SA",
  "1sa": "1SA",
  "2sam": "2SA",
  "2sa": "2SA",
  "1kgs": "1KI",
  "1ki": "1KI",
  "2kgs": "2KI",
  "2ki": "2KI",
  "1chr": "1CH",
  "1ch": "1CH",
  "2chr": "2CH",
  "2ch": "2CH",
  ezra: "EZR",
  neh: "NEH",
  est: "EST",
  esth: "EST",
  job: "JOB",
  ps: "PSA",
  psa: "PSA",
  psalm: "PSA",
  psalms: "PSA",
  prov: "PRO",
  pro: "PRO",
  pr: "PRO",
  eccl: "ECC",
  ecc: "ECC",
  song: "SNG",
  songs: "SNG",
  sos: "SNG",
  isa: "ISA",
  is: "ISA",
  jer: "JER",
  lam: "LAM",
  ezek: "EZK",
  ezk: "EZK",
  dan: "DAN",
  hos: "HOS",
  joel: "JOL",
  amos: "AMO",
  obad: "OBA",
  jonah: "JON",
  mic: "MIC",
  nah: "NAM",
  hab: "HAB",
  zeph: "ZEP",
  hag: "HAG",
  zech: "ZEC",
  mal: "MAL",
  matt: "MAT",
  mat: "MAT",
  mt: "MAT",
  mark: "MRK",
  mrk: "MRK",
  mk: "MRK",
  luke: "LUK",
  luk: "LUK",
  lk: "LUK",
  john: "JHN",
  jhn: "JHN",
  jn: "JHN",
  acts: "ACT",
  act: "ACT",
  rom: "ROM",
  ro: "ROM",
  "1cor": "1CO",
  "1co": "1CO",
  "2cor": "2CO",
  "2co": "2CO",
  gal: "GAL",
  eph: "EPH",
  phil: "PHP",
  php: "PHP",
  col: "COL",
  "1thess": "1TH",
  "1th": "1TH",
  "2thess": "2TH",
  "2th": "2TH",
  "1tim": "1TI",
  "1ti": "1TI",
  "2tim": "2TI",
  "2ti": "2TI",
  titus: "TIT",
  tit: "TIT",
  phlm: "PHM",
  phm: "PHM",
  heb: "HEB",
  jas: "JAS",
  jam: "JAS",
  james: "JAS",
  "1pet": "1PE",
  "1pe": "1PE",
  "2pet": "2PE",
  "2pe": "2PE",
  "1john": "1JN",
  "1jn": "1JN",
  "2john": "2JN",
  "2jn": "2JN",
  "3john": "3JN",
  "3jn": "3JN",
  jude: "JUD",
  rev: "REV",
  revelations: "REV",
};

const BOOK_BY_ID = new Map<string, BibleBookMeta>(BOOKS.map((b) => [b.id, b]));

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s:.-]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenizeQuery(query: string): string[] {
  return normalizeText(query)
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function resolveBook(rawBook: string): BibleBookMeta | null {
  const cleaned = rawBook.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  const compact = cleaned.replace(/\s+/g, "");

  const aliasId = BOOK_ALIASES[cleaned] ?? BOOK_ALIASES[compact];
  if (aliasId) return BOOK_BY_ID.get(aliasId) ?? null;

  for (const b of BOOKS) {
    const lowerName = b.name.toLowerCase();
    const compactName = lowerName.replace(/\s+/g, "");
    if (lowerName === cleaned || compactName === compact) return b;
  }

  // Prefix match for unambiguous 3+ character book names (e.g. "philip" -> Philippians)
  if (compact.length >= 3) {
    const match = BOOKS.find((b) => b.name.toLowerCase().replace(/\s+/g, "").startsWith(compact));
    if (match) return match;
  }

  return null;
}

/**
 * Parse a Scripture reference like "John 3:16", "Psalm 23", "1 Cor 13:4-5",
 * or a bare book name like "Philippians" into a direct /bible deep-link.
 */
export function parseBibleReference(rawQuery: string): BibleJumpHit | null {
  const trimmed = rawQuery.trim();
  if (!trimmed || trimmed.length > 60) return null;

  // Book + Chapter (+ optional :Verse[-EndVerse])
  const refMatch = trimmed.match(
    /^([1-3]?\s*[a-zA-Z]+(?:\s+of\s+[a-zA-Z]+)?)\.?\s+(\d{1,3})(?::(\d{1,3})(?:\s*[-–]\s*\d{1,3})?)?$/
  );

  if (refMatch) {
    const book = resolveBook(refMatch[1]);
    if (!book) return null;
    const chapter = Number.parseInt(refMatch[2], 10);
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) return null;
    const verse = refMatch[3] ? Number.parseInt(refMatch[3], 10) : undefined;
    if (verse !== undefined && (!Number.isInteger(verse) || verse < 1 || verse > 176)) return null;

    const params = new URLSearchParams({ book: book.id, chapter: String(chapter) });
    if (verse) params.set("verse", String(verse));
    const displayBook = book.id === "PSA" ? "Psalm" : book.name;
    const label = verse ? `${displayBook} ${chapter}:${verse}` : `${displayBook} ${chapter}`;

    return {
      bookId: book.id,
      bookName: book.name,
      chapter,
      verse,
      label,
      href: `/bible?${params.toString()}`,
    };
  }

  // Exact book name or well-known book alias (e.g. "Psalms", "Proverbs", "Romans")
  if (/^[1-3]?\s*[a-zA-Z]+(?:\s+of\s+[a-zA-Z]+)?$/.test(trimmed) && trimmed.length >= 4) {
    const book = resolveBook(trimmed);
    if (book) {
      const lowerTrimmed = trimmed.toLowerCase().replace(/\s+/g, "");
      const lowerBook = book.name.toLowerCase().replace(/\s+/g, "");
      const isDirectBook =
        lowerBook === lowerTrimmed ||
        (book.id === "PSA" && lowerTrimmed === "psalm") ||
        (lowerTrimmed.length >= 5 && lowerBook.startsWith(lowerTrimmed));
      if (isDirectBook) {
        return {
          bookId: book.id,
          bookName: book.name,
          chapter: 1,
          label: `${book.name} 1`,
          href: `/bible?book=${encodeURIComponent(book.id)}&chapter=1`,
        };
      }
    }
  }

  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extract deduplicated search terms (full query phrase + individual tokens >= 2 chars),
 * ordered longest-first so multi-word phrases highlight cleanly before shorter tokens.
 */
export function extractHighlightTerms(rawQuery: string): string[] {
  const trimmed = rawQuery.trim();
  if (!trimmed) return [];

  const seen = new Set<string>();
  const terms: string[] = [];

  const add = (candidate: string) => {
    const clean = candidate.trim();
    if (clean.length < 2) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    terms.push(clean);
  };

  add(trimmed);
  for (const token of tokenizeQuery(trimmed)) {
    add(token);
  }

  terms.sort((a, b) => b.length - a.length);
  return terms;
}

/**
 * Split text into matched / unmatched segments for safe React <mark> rendering.
 * Case-insensitive, preserves original casing and punctuation, never returns empty segments.
 */
export function splitHighlightSegments(text: string, rawQuery: string): HighlightSegment[] {
  if (!text) return [];
  const terms = extractHighlightTerms(rawQuery);
  if (terms.length === 0) return [{ text, match: false }];

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const segments: HighlightSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    const matchedText = match[0];
    if (!matchedText) continue;
    if (start > lastIndex) {
      segments.push({ text: text.slice(lastIndex, start), match: false });
    }
    segments.push({ text: matchedText, match: true });
    lastIndex = start + matchedText.length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), match: false });
  }

  return segments.length > 0 ? segments : [{ text, match: false }];
}

function buildExcerpt(text: string, query: string, maxLen = 128): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;

  const lower = cleaned.toLowerCase();
  const q = query.trim().toLowerCase();
  let idx = q ? lower.indexOf(q) : -1;

  // Fall back to the first matching keyword token so highlighted words appear inside the excerpt.
  if (idx === -1) {
    for (const token of tokenizeQuery(query)) {
      const tokenIdx = lower.indexOf(token);
      if (tokenIdx !== -1 && (idx === -1 || tokenIdx < idx)) {
        idx = tokenIdx;
      }
    }
  }

  if (idx > 40) {
    const start = Math.max(0, idx - 32);
    const slice = cleaned.slice(start, start + maxLen).trim();
    return `…${slice}${start + maxLen < cleaned.length ? "…" : ""}`;
  }
  return `${cleaned.slice(0, maxLen).trimEnd()}…`;
}

function scoreField(haystack: string, q: string, tokens: string[], weight: number): number {
  const lower = haystack.toLowerCase();
  let score = 0;
  if (lower === q) score += weight * 4;
  else if (lower.startsWith(q)) score += weight * 3;
  else if (lower.includes(q)) score += weight * 2;

  if (tokens.length > 0) {
    let matched = 0;
    for (const token of tokens) {
      if (lower.includes(token)) matched += 1;
    }
    if (matched === tokens.length) {
      score += weight * 1.5;
    } else if (matched > 0) {
      score += (weight * 0.6 * matched) / tokens.length;
    }
  }
  return score;
}

/** Search curated Bible verses by reference, theme, or text. */
export function searchVerses(rawQuery: string, limit = 5): VerseSearchHit[] {
  const q = normalizeText(rawQuery);
  if (!q) return [];
  const tokens = tokenizeQuery(rawQuery);
  const parsedRef = parseBibleReference(rawQuery);

  const scored: Array<{ score: number; hit: VerseSearchHit }> = [];

  for (const v of VERSES) {
    const themeMeta = THEME_BY_KEY.get(v.theme);
    const themeLabel = themeMeta?.label ?? v.theme;
    const themeBlurb = themeMeta?.blurb ?? "";

    let score =
      scoreField(v.ref, q, tokens, 12) +
      scoreField(themeLabel, q, tokens, 9) +
      scoreField(themeBlurb, q, tokens, 4) +
      scoreField(v.text, q, tokens, 6);

    const verseJump = parseBibleReference(v.ref);
    if (parsedRef && verseJump && parsedRef.bookId === verseJump.bookId) {
      if (parsedRef.chapter === verseJump.chapter) {
        score += 18;
        if (parsedRef.verse && parsedRef.verse === verseJump.verse) score += 12;
      } else {
        score += 5;
      }
    }

    if (score > 0) {
      scored.push({
        score,
        hit: {
          ref: v.ref,
          text: v.text,
          theme: v.theme,
          themeLabel,
          href: verseJump ? verseJump.href : `/verses?q=${encodeURIComponent(v.ref)}`,
          versesHref: `/verses?q=${encodeURIComponent(v.ref)}`,
        },
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.hit.ref.localeCompare(b.hit.ref));
  return scored.slice(0, limit).map((s) => s.hit);
}

/** Rank visible community posts by title, category, and body relevance. */
export function rankPosts(
  posts: PostSearchInput[],
  rawQuery: string,
  limit = 5
): PostSearchHit[] {
  const q = normalizeText(rawQuery);
  if (!q) return [];
  const tokens = tokenizeQuery(rawQuery);

  const scored: Array<{ score: number; hit: PostSearchHit }> = [];

  for (const p of posts) {
    if (p.hidden) continue;
    const categoryLabel = CATEGORY_LABELS[p.category] ?? p.category;
    const score =
      scoreField(p.title, q, tokens, 12) +
      scoreField(categoryLabel, q, tokens, 7) +
      scoreField(p.body, q, tokens, 6);

    if (score > 0) {
      scored.push({
        score,
        hit: {
          id: p.id,
          title: p.title,
          excerpt: buildExcerpt(p.body, rawQuery),
          category: p.category,
          categoryLabel,
          commentCount: p.commentCount,
          href: `/community/${p.id}`,
        },
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.hit);
}

/** Rank published worship instrumentals by title, scripture, album, description, or lyrics. */
export function rankTracks(
  tracks: TrackSearchInput[],
  rawQuery: string,
  limit = 5
): TrackSearchHit[] {
  const q = normalizeText(rawQuery);
  if (!q) return [];
  const tokens = tokenizeQuery(rawQuery);
  const parsedRef = parseBibleReference(rawQuery);

  const scored: Array<{ score: number; hit: TrackSearchHit }> = [];

  for (const t of tracks) {
    if (t.published === false) continue;
    let score =
      scoreField(t.title, q, tokens, 14) +
      scoreField(t.scripture, q, tokens, 11) +
      scoreField(t.album, q, tokens, 6) +
      scoreField(t.description, q, tokens, 7) +
      scoreField(t.lyrics, q, tokens, 4);

    if (parsedRef && t.scripture) {
      const trackJump = parseBibleReference(t.scripture);
      if (trackJump && trackJump.bookId === parsedRef.bookId) {
        score += trackJump.chapter === parsedRef.chapter ? 16 : 6;
      }
    }

    if (score > 0) {
      scored.push({
        score,
        hit: {
          id: t.id,
          title: t.title,
          album: t.album,
          scripture: t.scripture,
          description: t.description,
          coverUrl: t.coverUrl,
          durationSec: t.durationSec,
          href: "/music",
        },
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.hit);
}
