/**
 * Client-side chapter cache — the reader's "shelf".
 *
 * Three layers keep page turns instant and stay far under bible-api.com's
 * 15-requests-per-30-seconds ceiling:
 *
 *   1. Session memory  — a Map, so flipping back and forth inside one visit
 *                        costs zero network calls.
 *   2. IndexedDB       — visited chapters persist between visits (LRU-capped
 *                        at 250 chapters ≈ the Gospels + Psalms + change), and
 *                        remain readable offline.
 *   3. Network         — only on a true miss; responses also pass through the
 *                        site's own proxy, which carries an immutable
 *                        `max-age=31536000` browser cache header.
 *
 * `prefetchChapter` quietly warms the neighbouring chapters a second after a
 * chapter lands, so "Next" feels like turning a real, already-printed page.
 */

import type { ReaderDoc } from "@/components/bible/types";

/* ─── Layer 1: session memory ─────────────────────────────────────────────── */

const memory = new Map<string, ReaderDoc>();
const MEMORY_CAP = 80;

function memKey(translation: string, bookId: string, chapter: number): string {
  return `${translation.toLowerCase()}:${bookId.toUpperCase()}:${chapter}`;
}

/* ─── Layer 2: IndexedDB ──────────────────────────────────────────────────── */

const DB_NAME = "ddog-bible";
const DB_VERSION = 1;
const STORE = "chapters";
const IDB_CAP = 250;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      let settled = false;
      const finish = (db: IDBDatabase | null) => {
        if (!settled) {
          settled = true;
          resolve(db);
        }
      };
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        };
        req.onsuccess = () => {
          // Some browsers fire a second versionchange when the tab was
          // opened against an older DB — treat failures as "no cache".
          req.result.onversionchange = () => req.result.close();
          finish(req.result);
        };
        req.onerror = () => finish(null);
        req.onblocked = () => finish(null);
        setTimeout(() => finish(null), 2500);
      } catch {
        finish(null);
      }
    });
  }
  return dbPromise;
}

type StoredChapter = { doc: ReaderDoc; at: number };

async function idbGet(key: string): Promise<StoredChapter | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as StoredChapter | undefined) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPut(key: string, doc: ReaderDoc): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ doc, at: Date.now() } satisfies StoredChapter, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** Evict roughly the oldest tenth when the cap is exceeded. */
async function idbTrim(): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const all: { key: IDBValidKey; at: number }[] = [];
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) return;
        const value = cursor.value as StoredChapter | undefined;
        all.push({ key: cursor.key, at: value?.at ?? 0 });
        cursor.continue();
      };
      tx.oncomplete = () => {
        try {
          if (all.length > IDB_CAP) {
            const excess = all.length - IDB_CAP;
            all.sort((a, b) => a.at - b.at);
            for (let i = 0; i < excess; i++) store.delete(all[i].key);
          }
        } finally {
          resolve();
        }
      };
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

/* ─── Public API ──────────────────────────────────────────────────────────── */

/** Memory hit? (Also warms the entry — Map iteration order = insertion.) */
export function peekMemory(translation: string, bookId: string, chapter: number): ReaderDoc | null {
  const key = memKey(translation, bookId, chapter);
  const hit = memory.get(key);
  if (!hit) return null;
  memory.delete(key);
  memory.set(key, hit); // refresh recency
  return hit;
}

/** Memory → IndexedDB. Resolves null on a miss. */
export async function getCachedChapter(
  translation: string,
  bookId: string,
  chapter: number,
): Promise<ReaderDoc | null> {
  const key = memKey(translation, bookId, chapter);
  const memHit = memory.get(key);
  if (memHit) {
    memory.delete(key);
    memory.set(key, memHit);
    return memHit;
  }
  const stored = await idbGet(key);
  if (stored?.doc) {
    memory.set(key, stored.doc);
    return stored.doc;
  }
  return null;
}

function rememberInMemory(key: string, doc: ReaderDoc) {
  if (memory.size >= MEMORY_CAP) {
    const oldest = memory.keys().next().value;
    if (oldest) memory.delete(oldest);
  }
  memory.set(key, doc);
}

/** Persist a freshly fetched (or freshly served) chapter to both layers. */
export async function storeChapter(doc: ReaderDoc): Promise<void> {
  const key = memKey(doc.translationId, doc.bookId, doc.chapter);
  rememberInMemory(key, doc);
  await idbPut(key, doc);
  void idbTrim();
}

/* ─── Network fetch + prefetch ────────────────────────────────────────────── */

async function fetchFromNetwork(params: { translationId: string; bookId: string; chapter: number }): Promise<ReaderDoc> {
  const search = new URLSearchParams({
    book: params.bookId,
    chapter: String(params.chapter),
    translation: params.translationId,
  });
  const res = await fetch(`/api/bible/chapter?${search.toString()}`);
  const json = (await res.json()) as {
    error?: string;
    translationId?: string;
    translationName?: string;
    licenseNote?: string;
    bookId?: string;
    bookName?: string;
    chapter?: number;
    verses?: ReaderDoc["verses"];
  };
  if (!res.ok || !json.verses?.length) {
    throw new Error(json.error || "That chapter could not be fetched. Please try again.");
  }
  return {
    translationId: json.translationId ?? params.translationId,
    translationName: json.translationName ?? params.translationId.toUpperCase(),
    licenseNote: json.licenseNote ?? "Public Domain",
    bookId: json.bookId ?? params.bookId,
    bookName: json.bookName ?? params.bookId,
    chapter: json.chapter ?? params.chapter,
    verses: json.verses,
    highlight: [],
  };
}

const inFlight = new Map<string, Promise<ReaderDoc>>();

/**
 * Fetch a chapter through memory → IndexedDB → network, caching on the way
 * back. `onStale` lets the caller mark a served-from-shelf doc (offline).
 */
export async function getChapter(
  translation: string,
  bookId: string,
  chapter: number,
): Promise<{ doc: ReaderDoc; source: "memory" | "shelf" | "network" }> {
  const key = memKey(translation, bookId, chapter);
  const memHit = memory.get(key);
  if (memHit) {
    memory.delete(key);
    memory.set(key, memHit);
    return { doc: memHit, source: "memory" };
  }

  const cached = await idbGet(key);
  if (cached?.doc) {
    memory.set(key, cached.doc);
    return { doc: cached.doc, source: "shelf" };
  }

  const existing = inFlight.get(key);
  if (existing) return { doc: await existing, source: "network" };

  const pending = fetchFromNetwork({ translationId: translation, bookId, chapter })
    .then(async (doc) => {
      await storeChapter(doc);
      return doc;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, pending);
  const doc = await pending;
  return { doc, source: "network" };
}

/**
 * Quietly warm a chapter for later. Returns true when the chapter is now
 * guaranteed on the shelf (was cached or just arrived). Never throws.
 */
export async function prefetchChapter(
  translation: string,
  bookId: string,
  chapter: number,
): Promise<boolean> {
  try {
    const key = memKey(translation, bookId, chapter);
    if (memory.has(key)) return true;
    const cached = await idbGet(key);
    if (cached?.doc) {
      memory.set(key, cached.doc);
      return true;
    }
    await getChapter(translation, bookId, chapter);
    return true;
  } catch {
    return false;
  }
}
