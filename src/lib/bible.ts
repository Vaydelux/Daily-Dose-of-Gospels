import "server-only";

import { BOOKS, BOOK_NAME_BY_ID } from "./bible/books-meta";

/**
 * Server-side integration with bible-api.com (https://bible-api.com).
 *
 * Design notes (from the API's own integration guide):
 * - Verse text never changes → cache aggressively (Next HTTP cache + an
 *   in-process memory layer). Everyone on the server shares one IP and the
 *   upstream limit is 15 requests / 30 s, so bursts of visitors must never
 *   multiply upstream calls for the same passage.
 * - Never bulk-download; we only ever fetch single chapters / small passages.
 * - Always surface translation name + license note for attribution.
 */

const API = "https://bible-api.com";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type BibleVerse = {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};

export type BibleChapter = {
  translationId: string;
  translationName: string;
  licenseNote: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verses: BibleVerse[];
};

export type BibleTranslation = {
  identifier: string;
  name: string;
  language: string;
  license?: string;
};

export type BibleBook = {
  id: string;
  name: string;
  chapters: number;
  testament: "OT" | "NT";
};

/* Book metadata lives in the client-safe module src/lib/bible/books-meta.ts
   (shared with the reader and the homepage ribbon) and is re-exported here. */
export { BOOKS, BOOK_NAME_BY_ID } from "./bible/books-meta";

/** Single-chapter books — whole-book references need `indifferent` matching. */
const SINGLE_CHAPTER_IDS = new Set(["OBA", "PHM", "2JN", "3JN", "JUD"]);

/** Restrict "random verse" to well-known treasures, per the API's own tip. */
export const RANDOM_BOOK_IDS = ["PSA", "PRO", "ISA", "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "HEB", "JAS", "1PE", "1JN"];

/* ─── Embedded fallbacks (public-domain KJV, offline treasury) ──────────── */

/** A small treasury of beloved KJV verses for when the upstream API is down. */
const FALLBACK_VERSES: BibleVerse[] = [
  { bookId: "JHN", bookName: "John", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { bookId: "PSA", bookName: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want." },
  { bookId: "PSA", bookName: "Psalms", chapter: 46, verse: 1, text: "God is our refuge and strength, a very present help in trouble." },
  { bookId: "PSA", bookName: "Psalms", chapter: 119, verse: 105, text: "Thy word is a lamp unto my feet, and a light unto my path." },
  { bookId: "PRO", bookName: "Proverbs", chapter: 3, verse: 5, text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
  { bookId: "ISA", bookName: "Isaiah", chapter: 40, verse: 31, text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint." },
  { bookId: "ISA", bookName: "Isaiah", chapter: 41, verse: 10, text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness." },
  { bookId: "JER", bookName: "Jeremiah", chapter: 29, verse: 11, text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end." },
  { bookId: "MAT", bookName: "Matthew", chapter: 11, verse: 28, text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest." },
  { bookId: "MAT", bookName: "Matthew", chapter: 6, verse: 33, text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you." },
  { bookId: "JHN", bookName: "John", chapter: 1, verse: 1, text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
  { bookId: "JHN", bookName: "John", chapter: 14, verse: 6, text: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me." },
  { bookId: "ROM", bookName: "Romans", chapter: 8, verse: 28, text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
  { bookId: "ROM", bookName: "Romans", chapter: 12, verse: 2, text: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God." },
  { bookId: "1CO", bookName: "1 Corinthians", chapter: 13, verse: 4, text: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up," },
  { bookId: "2CO", bookName: "2 Corinthians", chapter: 5, verse: 17, text: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new." },
  { bookId: "GAL", bookName: "Galatians", chapter: 2, verse: 20, text: "I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me: and the life which I now live in the flesh I live by the faith of the Son of God, who loved me, and gave himself for me." },
  { bookId: "EPH", bookName: "Ephesians", chapter: 2, verse: 8, text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:" },
  { bookId: "PHP", bookName: "Philippians", chapter: 4, verse: 13, text: "I can do all things through Christ which strengtheneth me." },
  { bookId: "HEB", bookName: "Hebrews", chapter: 11, verse: 1, text: "Now faith is the substance of things hoped for, the evidence of things not seen." },
  { bookId: "JAS", bookName: "James", chapter: 1, verse: 5, text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him." },
  { bookId: "1JN", bookName: "1 John", chapter: 1, verse: 9, text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness." },
];

/** Embedded translation list (mirrors /data) — used when upstream is down. */
const FALLBACK_TRANSLATIONS: BibleTranslation[] = [
  { identifier: "kjv", name: "King James Version", language: "English" },
  { identifier: "web", name: "World English Bible", language: "English" },
  { identifier: "asv", name: "American Standard Version", language: "English" },
  { identifier: "bsb", name: "Berean Standard Bible", language: "English" },
  { identifier: "bbe", name: "Bible in Basic English", language: "English" },
  { identifier: "darby", name: "Darby Bible", language: "English" },
  { identifier: "dra", name: "Douay-Rheims 1899 American Edition", language: "English" },
  { identifier: "webbe", name: "World English Bible, British Edition", language: "English (UK)" },
  { identifier: "oeb-cw", name: "Open English Bible, Commonwealth Edition", language: "English (UK)" },
  { identifier: "oeb-us", name: "Open English Bible, US Edition", language: "English (US)" },
  { identifier: "cuv-simp", name: "Chinese Union Version", language: "Chinese (Simplified)" },
  { identifier: "cuv", name: "Chinese Union Version", language: "Chinese (Traditional)" },
  { identifier: "bkr", name: "Bible kralická", language: "Czech" },
  { identifier: "danish", name: "Danish Bible", language: "Danish" },
  { identifier: "statenvertaling", name: "Statenvertaling", language: "Dutch" },
  { identifier: "biblia", name: "Finnish Bible", language: "Finnish" },
  { identifier: "luther1912", name: "Luther Bible 1912", language: "German" },
  { identifier: "leningrad", name: "Hebrew Leningrad Codex", language: "Hebrew" },
  { identifier: "karoli", name: "Károli Bible", language: "Hungarian" },
  { identifier: "riveduta", name: "Italian Riveduta", language: "Italian" },
  { identifier: "bungo", name: "Japanese Bungo (Classical)", language: "Japanese" },
  { identifier: "kougo", name: "Japanese Kougo (Colloquial)", language: "Japanese" },
  { identifier: "korean", name: "Korean Revised Version", language: "Korean" },
  { identifier: "clementine", name: "Clementine Latin Vulgate", language: "Latin" },
  { identifier: "norwegian", name: "Norwegian Bible", language: "Norwegian" },
  { identifier: "gdanska", name: "Gdańska Bible", language: "Polish" },
  { identifier: "rccv", name: "Romanian Corrected Cornilescu Version", language: "Romanian" },
  { identifier: "synodal", name: "Russian Synodal Translation", language: "Russian" },
  { identifier: "bes", name: "La Biblia en Español Sencillo", language: "Spanish" },
  { identifier: "pddpt", name: "Palabra de Dios para ti", language: "Spanish" },
  { identifier: "rv1909", name: "Reina Valera 1909", language: "Spanish" },
  { identifier: "swahili", name: "Swahili Bible", language: "Swahili" },
  { identifier: "swedish", name: "Swedish Bible", language: "Swedish" },
  { identifier: "tagalog", name: "Tagalog Bible", language: "Tagalog" },
  { identifier: "cadman", name: "Vietnamese Cadman Bible 1934", language: "Vietnamese" },
];

/* ─── In-process memory cache (burst shield in front of the HTTP cache) ─── */

const MEM_TTL_MS = 6 * 60 * 60 * 1000; // 6h — verse text is immutable
const mem = new Map<string, { at: number; data: unknown }>();

function memGet<T>(key: string): T | undefined {
  const hit = mem.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > MEM_TTL_MS) return undefined;
  return hit.data as T;
}

function memSet(key: string, data: unknown) {
  // Simple size guard — plenty for a reader's working set.
  if (mem.size > 600) {
    const oldest = mem.keys().next().value;
    if (oldest) mem.delete(oldest);
  }
  mem.set(key, { at: Date.now(), data });
}

/**
 * Fetch JSON from bible-api.com with two cache layers:
 * 1. in-process memory (protects the shared IP from request bursts),
 * 2. Next.js HTTP cache (`next.revalidate`) for cross-request persistence.
 * On upstream failure, stale memory is served before giving up.
 */
async function bibleFetch<T>(path: string, revalidateSec: number): Promise<T> {
  const key = `bible:${path}`;
  const cached = memGet<T>(key);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(`${API}${path}`, {
      next: { revalidate: revalidateSec },
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      throw new BibleApiError(`bible-api responded ${res.status}`, res.status);
    }
    const data = (await res.json()) as T;
    memSet(key, data);
    return data;
  } catch (e) {
    const stale = mem.get(key); // allow stale-on-error, even beyond TTL
    if (stale) return stale.data as T;
    console.error(`[bible-api] ${path} failed:`, e instanceof Error ? e.message : e);
    throw e;
  }
}

/* ─── Normalizers ───────────────────────────────────────────────────────── */

function normTranslation(t: unknown, fallbackId: string): { id: string; name: string; license: string } {
  const o = (t ?? {}) as { identifier?: string; name?: string; license?: string };
  return {
    id: typeof o.identifier === "string" && o.identifier ? o.identifier : fallbackId,
    name: typeof o.name === "string" && o.name ? o.name : fallbackId.toUpperCase(),
    license: typeof o.license === "string" ? o.license : "Public Domain",
  };
}

function trimText(s: unknown): string {
  return typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "";
}

/* ─── Public API ────────────────────────────────────────────────────────── */

const DAY = 60 * 60 * 24;

export class BibleApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Parameterized API — every verse of one chapter. Cached for 30 days. */
export async function fetchChapter(bookId: string, chapter: number, translation = "kjv"): Promise<BibleChapter> {
  const book = BOOKS.find((b) => b.id === bookId.toUpperCase());
  if (!book) throw new BibleApiError("Unknown book", 400);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    throw new BibleApiError("Chapter out of range", 400);
  }
  const t = translation.toLowerCase();
  type Upstream = {
    translation?: unknown;
    verses?: { book_id?: string; book?: string; chapter?: number; verse?: number; text?: string }[];
  };
  const data = await bibleFetch<Upstream>(`/data/${t}/${book.id}/${chapter}`, 30 * DAY);
  const meta = normTranslation(data.translation, t);
  const verses = (data.verses ?? []).map((v) => ({
    bookId: v.book_id ?? book.id,
    bookName: v.book ?? book.name,
    chapter: v.chapter ?? chapter,
    verse: Number(v.verse ?? 0),
    text: trimText(v.text),
  })).filter((v) => v.verse > 0 && v.text);

  if (!verses.length) throw new BibleApiError("Chapter not found", 404);
  return {
    translationId: meta.id,
    translationName: meta.name,
    licenseNote: meta.license,
    bookId: book.id,
    bookName: verses[0].bookName || book.name,
    chapter,
    verses,
  };
}

/** User Input API — free-text reference such as "john 3:16" or "jn 3:16". */
export async function fetchPassage(ref: string, translation = "kjv"): Promise<{
  reference: string;
  translationName: string;
  translationId: string;
  licenseNote: string;
  verses: BibleVerse[];
}> {
  const clean = ref.trim().replace(/\s+/g, " ");
  if (!clean || clean.length > 80) throw new BibleApiError("Missing or invalid reference", 400);
  const t = translation.toLowerCase();

  // Whole-book references for single-chapter books ("jude", "2 john", …)
  // should return the whole book, not verse 1 — per the API's docs that is
  // "jude 1" plus single_chapter_book_matching=indifferent.
  const bookOnly = /^(?:obadiah|obd|philemon|phm|2\s*john|2\s*jn|3\s*john|3\s*jn|jude|jud)\.?$/i.test(clean);
  const upstreamRef = bookOnly ? `${clean} 1` : clean;

  const qs = new URLSearchParams({ translation: t });
  if (bookOnly) qs.set("single_chapter_book_matching", "indifferent");

  type Upstream = {
    reference?: string;
    verses?: { book_id?: string; book_name?: string; chapter?: number; verse?: number; text?: string }[];
    translation_id?: string;
    translation_name?: string;
    translation_note?: string;
  };
  const data = await bibleFetch<Upstream>(`/${encodeURIComponent(upstreamRef)}?${qs.toString()}`, 30 * DAY);
  const verses = (data.verses ?? []).map((v) => ({
    bookId: v.book_id ?? "",
    bookName: v.book_name ?? BOOK_NAME_BY_ID.get(v.book_id ?? "") ?? "",
    chapter: v.chapter ?? 0,
    verse: Number(v.verse ?? 0),
    text: trimText(v.text),
  })).filter((v) => v.verse > 0 && v.text && v.chapter > 0);

  if (!verses.length) throw new BibleApiError("Reference not found", 404);
  return {
    reference: typeof data.reference === "string" ? data.reference : clean,
    translationId: typeof data.translation_id === "string" ? data.translation_id : t,
    translationName: typeof data.translation_name === "string" ? data.translation_name : t.toUpperCase(),
    licenseNote: typeof data.translation_note === "string" ? data.translation_note : "Public Domain",
    verses,
  };
}

/** Random verse restricted to a curated set of books. Falls back offline. */
export async function fetchRandom(translation = "kjv"): Promise<{ verse: BibleVerse; translationName: string; translationId: string; fallback: boolean }> {
  const t = translation.toLowerCase();
  type Upstream = {
    translation?: unknown;
    random_verse?: { book_id?: string; book?: string; chapter?: number; verse?: number; text?: string };
  };
  try {
    const data = await bibleFetch<Upstream>(`/data/${t}/random/${RANDOM_BOOK_IDS.join(",")}`, 0);
    const rv = data.random_verse;
    const text = trimText(rv?.text);
    if (rv && text && (rv.verse ?? 0) > 0) {
      const meta = normTranslation(data.translation, t);
      return {
        verse: {
          bookId: rv.book_id ?? "PSA",
          bookName: rv.book ?? BOOK_NAME_BY_ID.get(rv.book_id ?? "") ?? "Psalms",
          chapter: rv.chapter ?? 23,
          verse: Number(rv.verse ?? 1),
          text,
        },
        translationName: meta.name,
        translationId: meta.id,
        fallback: false,
      };
    }
    throw new BibleApiError("Malformed random verse", 502);
  } catch {
    // Offline treasury — still give the reader something true and lovely.
    const pick = FALLBACK_VERSES[Math.floor(Math.random() * FALLBACK_VERSES.length)];
    return { verse: pick, translationName: "King James Version", translationId: "kjv", fallback: true };
  }
}

/** A single beloved verse served entirely from the local KJV treasury. */
export function localFallbackVerse(): BibleVerse {
  return FALLBACK_VERSES[0];
}

/** /data — the live translation catalogue (7-day cache, embedded fallback). */
export async function fetchTranslations(): Promise<BibleTranslation[]> {
  type Upstream = { translations?: { identifier?: string; name?: string; language?: string; license?: string }[] };
  try {
    const data = await bibleFetch<Upstream>("/data", 7 * DAY);
    const list = (data.translations ?? [])
      .map((x) => ({
        identifier: String(x.identifier ?? ""),
        name: String(x.name ?? ""),
        language: String(x.language ?? ""),
        license: x.license ? String(x.license) : undefined,
      }))
      .filter((x) => x.identifier && x.name);
    if (list.length >= 10) return list;
    throw new BibleApiError("Translation list too short", 502);
  } catch {
    return FALLBACK_TRANSLATIONS;
  }
}

/** /data/{t} — book list for a translation, merged with chapter counts. */
export async function fetchBooks(translation = "kjv"): Promise<BibleBook[]> {
  type Upstream = { books?: { id?: string; name?: string }[] };
  try {
    const data = await bibleFetch<Upstream>(`/data/${translation.toLowerCase()}`, 30 * DAY);
    const upstream = data.books ?? [];
    if (upstream.length < 60) throw new BibleApiError("Book list too short", 502);
    // Upstream gives authoritative id/name pairs; merge our chapter counts.
    const byId = new Map(BOOKS.map((b) => [b.id, b]));
    const merged: BibleBook[] = [];
    for (const b of upstream) {
      const id = String(b.id ?? "").toUpperCase();
      const known = byId.get(id);
      if (!known) continue;
      merged.push({ ...known, name: String(b.name ?? known.name) });
    }
    if (merged.length >= 60) return merged;
    throw new BibleApiError("Book merge failed", 502);
  } catch {
    return BOOKS;
  }
}

export { SINGLE_CHAPTER_IDS };
