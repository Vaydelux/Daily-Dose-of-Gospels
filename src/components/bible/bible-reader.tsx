"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import {
  AudioLines,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Feather,
  Languages,
  Pause,
  Quote,
  Search,
  Sparkles,
  Square,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getChapter, prefetchChapter, storeChapter } from "@/lib/bible/chapter-store";
import { nextChapterOf, prevChapterOf } from "@/lib/bible/books-meta";
import { RED_LETTER_BOOKS } from "@/lib/bible/red-letter";
import { PERF_LITE_EVENT, PERF_LITE_KEY } from "@/components/site/perf-probe";
import { BookSpread } from "./book-spread";
import { useNarration, VOICE_PRESETS, type NarrationRate } from "./use-narration";
import type { BibleBookMeta, ReaderDoc, ReaderVerse, TranslationMeta } from "./types";

const POS_KEY = "ddog.bible.pos.v1";
const RED_LETTER_KEY = "ddog.bible.red-letter.v1";
const FX_KEY = "ddog.bible.fx.v1";
const OPEN_KEY = "ddog.bible.opened.v1";

type FxMode = "auto" | "rich" | "lite";

/**
 * Heuristic: does this device lack the GPU/CPU headroom for the full 3D
 * page-turn? Reduced-motion users, touch devices at tablet-or-smaller
 * widths, and modest chip/memory budgets all get the lite mode by default.
 * The toolbar toggle always has the final word.
 */
function devicePrefersLite(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory > 0 && nav.deviceMemory <= 4;
    const lowCores = (navigator.hardwareConcurrency ?? 8) <= 4;
    const touchAtReaderSizes =
      window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(max-width: 1023px)").matches;
    return lowMemory || lowCores || touchAtReaderSizes;
  } catch {
    return false;
  }
}

/** Best-effort BCP-47 tag so narration matches the open translation. */
function speechLang(translationId: string, translations: TranslationMeta[]): string {
  const language = translations.find((t) => t.identifier === translationId)?.language ?? "English";
  const l = language.toLowerCase();
  if (l.startsWith("english")) return "en-US";
  if (l.startsWith("chinese")) return "zh-CN";
  if (l.startsWith("tagalog") || l.startsWith("filipino")) return "tl-PH";
  if (l.startsWith("spanish")) return "es-ES";
  if (l.startsWith("french")) return "fr-FR";
  if (l.startsWith("german")) return "de-DE";
  if (l.startsWith("portuguese")) return "pt-BR";
  if (l.startsWith("romanian")) return "ro-RO";
  if (l.startsWith("czech")) return "cs-CZ";
  if (l.startsWith("latin")) return "la";
  const base = language.split(/[\s(—-]/)[0];
  return base ? base.toLowerCase() : "en";
}

type Metrics = { capacity: number; cpl: number };

/** Greedy, verse-aligned pagination driven by the measured page box. */
function paginate(verses: ReaderVerse[], capacity: number, cpl: number): ReaderVerse[][] {
  const overhead = Math.max(24, Math.round(cpl * 0.62));
  const out: ReaderVerse[][] = [];
  let cur: ReaderVerse[] = [];
  let used = 0;
  for (const v of verses) {
    const cost = v.text.length + overhead + 4;
    if (cur.length && used + cost > capacity) {
      out.push(cur);
      cur = [];
      used = 0;
    }
    cur.push(v);
    used += cost;
  }
  if (cur.length) out.push(cur);
  return out.length ? out : [[]];
}

function isTypingTarget(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null;
  if (!t) return false;
  return (
    t.tagName === "INPUT" ||
    t.tagName === "TEXTAREA" ||
    t.tagName === "SELECT" ||
    t.isContentEditable
  );
}

export function BibleReader({
  initialDoc,
  translations,
  books,
  allowResume = true,
}: {
  initialDoc: ReaderDoc | null;
  translations: TranslationMeta[];
  books: BibleBookMeta[];
  /** False when a deep link (/bible?book=…&chapter=…) names the page. */
  allowResume?: boolean;
}) {
  /* ─── State ──────────────────────────────────────────────────────────── */
  const [doc, setDoc] = useState<ReaderDoc | null>(initialDoc);
  const [translation, setTranslation] = useState(initialDoc?.translationId ?? "kjv");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialDoc ? null : "The first page could not be inked — the Bible API was unreachable. Press try again.",
  );
  const [view, setView] = useState(0);
  const [flip, setFlip] = useState<{ dir: "next" | "prev"; target: number } | null>(null);
  const [isSpread, setIsSpread] = useState(true);
  const [metrics, setMetrics] = useState<Metrics>({ capacity: 1500, cpl: 68 });
  const [coverState, setCoverState] = useState<"closed" | "opening" | "open">("closed");
  const [arriveKey, setArriveKey] = useState(0);
  const [query, setQuery] = useState("");
  const [redLetterOn, setRedLetterOn] = useState(true);
  const [fxMode, setFxMode] = useState<FxMode>("auto");
  const [deviceLite, setDeviceLite] = useState(false);

  const flipTargetRef = useRef<number | null>(null);
  const focusVerseRef = useRef<number | null>(null);
  const coverRef = useRef<"closed" | "opening" | "open">("closed");
  const bookRef = useRef<HTMLDivElement | null>(null);
  const docRef = useRef<ReaderDoc | null>(doc);
  const autoContinueRef = useRef(false);
  const fxLiteRef = useRef(false);
  docRef.current = doc;

  /* ─── Derived ────────────────────────────────────────────────────────── */
  const duo: 1 | 2 = isSpread ? 2 : 1;
  const fxLite = fxMode === "lite" || (fxMode === "auto" && deviceLite);
  const pages = useMemo(
    () => (doc ? paginate(doc.verses, metrics.capacity, metrics.cpl) : [[]]),
    [doc, metrics],
  );
  const maxView = Math.max(0, Math.ceil(pages.length / duo) - 1);

  const bookMeta = useMemo(() => books.find((b) => b.id === doc?.bookId) ?? null, [books, doc]);
  const bookIndex = useMemo(() => books.findIndex((b) => b.id === doc?.bookId), [books, doc]);

  const sortedTranslations = useMemo(() => {
    const en = translations.filter((t) => t.language.toLowerCase().startsWith("english"));
    en.sort((a, b) =>
      a.identifier === "kjv" ? -1 : b.identifier === "kjv" ? 1 : a.name.localeCompare(b.name),
    );
    const rest = translations
      .filter((t) => !t.language.toLowerCase().startsWith("english"))
      .sort((a, b) => a.language.localeCompare(b.language) || a.name.localeCompare(b.name));
    return [...en, ...rest];
  }, [translations]);

  /* ─── Loaders (all state-independent — params fully describe the target) ── */

  const remember = useCallback(
    (bookId: string, chapter: number, translationId: string, bookName?: string) => {
      try {
        localStorage.setItem(
          POS_KEY,
          JSON.stringify({ b: bookId, c: chapter, t: translationId, bn: bookName ?? null, at: Date.now() }),
        );
      } catch {
        /* storage may be unavailable — reading works regardless */
      }
    },
    [],
  );

  /**
   * Open a chapter through the three-layer cache (session memory →
   * IndexedDB shelf → network via the site's own cached proxy).
   */
  const loadChapter = useCallback(
    async (
      bookId: string,
      chapter: number,
      translationId: string,
      focus?: number[],
      note?: string,
      opts?: { autoContinue?: boolean },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const { doc: fresh } = await getChapter(translationId, bookId, chapter);
        focusVerseRef.current = focus?.length ? Math.min(...focus) : null;
        setDoc({
          ...fresh,
          highlight: focus ?? [],
          note,
        });
        setTranslation(fresh.translationId);
        setView(0);
        setFlip(null);
        setArriveKey((k) => k + 1);
        remember(fresh.bookId, fresh.chapter, fresh.translationId, fresh.bookName);
        if (opts?.autoContinue) autoContinueRef.current = true;
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Something went wrong. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [remember],
  );

  /* ─── Audio narration — the Scripture, read aloud ───────────────────── */

  const narration = useNarration({
    onFinished: () => {
      // When a chapter finishes being read, turn the leaf and carry on.
      const current = docRef.current;
      if (!current) return;
      const next = nextChapterOf(current.bookId, current.chapter);
      if (!next) return;
      void loadChapter(
        next.bookId,
        next.chapter,
        current.translationId,
        undefined,
        "The reading continues into the next chapter.",
        { autoContinue: true },
      );
    },
  });

  const loadReference = useCallback(
    async (ref: string, translationId: string) => {
      narration.stop();
      setLoading(true);
      setError(null);
      let handedOff = false;
      try {
        const res = await fetch(
          `/api/bible/passage?ref=${encodeURIComponent(ref)}&translation=${encodeURIComponent(translationId)}`,
        );
        const json: {
          reference?: string; translationId?: string; translationName?: string; licenseNote?: string;
          verses?: ReaderVerse[]; error?: string;
        } = await res.json();
        if (!res.ok || !json.verses?.length) {
          throw new Error(json.error || `Could not find "${ref}".`);
        }
        const verses = json.verses;
        const first = verses[0];
        const tid = json.translationId ?? translationId;

        if (verses.length >= 30 || !first?.bookId || !first?.chapter) {
          // A whole-chapter reference — use the passage directly.
          focusVerseRef.current = null;
          const wholeDoc: ReaderDoc = {
            translationId: tid,
            translationName: json.translationName ?? tid.toUpperCase(),
            licenseNote: json.licenseNote ?? "Public Domain",
            bookId: first.bookId,
            bookName: first.bookName,
            chapter: first.chapter,
            verses,
            highlight: [],
          };
          setDoc(wholeDoc);
          setTranslation(tid);
          setView(0);
          setFlip(null);
          setArriveKey((k) => k + 1);
          if (first?.bookId) remember(first.bookId, first.chapter, tid, first.bookName);
          // Chapter-level refs ("Psalm 119", never "Psalm 119:1-100") are
          // complete chapters — shelve them for the next visitor too.
          if (
            first?.bookId &&
            first.verse === 1 &&
            verses.length >= 30 &&
            !(json.reference ?? "").includes(":")
          ) {
            void storeChapter(wholeDoc);
          }
        } else {
          // A narrow passage — open the full chapter and highlight the verses.
          // (A whole-chapter request reads better un-highlighted.)
          handedOff = true;
          const sameChapter = verses.every((v) => v.chapter === first.chapter);
          const wholeChapter = sameChapter && first.verse === 1 && verses.length > 5;
          const focus = wholeChapter
            ? []
            : (sameChapter ? verses.map((v) => v.verse) : [first.verse]).filter((n) => n > 0);
          void loadChapter(first.bookId, first.chapter, tid, focus);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      } finally {
        if (!handedOff) setLoading(false);
      }
    },
    [loadChapter, remember, narration],
  );

  const loadRandom = useCallback(
    async (translationId: string) => {
      narration.stop();
      setLoading(true);
      setError(null);
      let handedOff = false;
      try {
        const res = await fetch(`/api/bible/random?translation=${encodeURIComponent(translationId)}`);
        const json: {
          verse?: ReaderVerse;
          translationId?: string;
          translationName?: string;
          fallback?: boolean;
        } = await res.json();
        const v = json.verse;
        if (!v || !v.bookId) throw new Error("Could not draw a verse just now — please try again.");
        handedOff = true;
        if (json.fallback) {
          focusVerseRef.current = v.verse;
          setDoc({
            translationId: json.translationId ?? "kjv",
            translationName: json.translationName ?? "King James Version",
            licenseNote: "Public Domain",
            bookId: v.bookId,
            bookName: v.bookName,
            chapter: v.chapter,
            verses: [v],
            highlight: [v.verse],
            note: "Served from the local KJV treasury while the Bible API reconnects.",
          });
          setTranslation(json.translationId ?? "kjv");
          setView(0);
          setFlip(null);
          setArriveKey((k) => k + 1);
        } else {
          void loadChapter(v.bookId, v.chapter, translationId, [v.verse]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not draw a verse just now — please try again.");
      } finally {
        if (!handedOff) setLoading(false);
      }
    },
    [loadChapter, narration],
  );

  /* ─── Page turning ───────────────────────────────────────────────────── */

  const turn = (dir: "next" | "prev") => {
    if (loading || coverRef.current !== "open") return;
    const target = dir === "next" ? view + 1 : view - 1;
    if (target < 0 || target > maxView) return;
    if (fxLiteRef.current) {
      // Lite path: no 3D sheet — swap and let the keyed slots fade in.
      setView(target);
      setArriveKey((k) => k + 1);
      return;
    }
    if (flip) return;
    flipTargetRef.current = target;
    setFlip({ dir, target });
  };
  const turnRef = useRef(turn);
  turnRef.current = turn;

  /* While the Scripture is read aloud, the reader turns its own leaves. */
  useEffect(() => {
    const v = narration.currentVerse;
    if (v === null || !doc || flip || loading || coverRef.current !== "open") return;
    const idx = pages.findIndex((pg) => pg.some((x) => x.verse === v));
    if (idx < 0) return;
    const target = Math.floor(idx / duo);
    if (target === view) return;
    if (fxLiteRef.current) {
      setView(target);
      setArriveKey((k) => k + 1);
      return;
    }
    flipTargetRef.current = target;
    setFlip({ dir: target > view ? "next" : "prev", target });
  }, [narration.currentVerse, pages, duo, view, flip, loading, doc]);

  /* A finished chapter quietly hands the reading to the next one. */
  useEffect(() => {
    if (!autoContinueRef.current || !doc?.verses.length) return;
    autoContinueRef.current = false;
    narration.play(doc.verses, speechLang(doc.translationId, translations));
  }, [doc, narration, translations]);

  const commitFlip = useCallback(() => {
    const target = flipTargetRef.current;
    flipTargetRef.current = null;
    setFlip(null);
    if (target !== null) setView(target);
  }, []);

  /* Fallback commit in case animationend never fires (hidden tab, etc.) */
  useEffect(() => {
    if (!flip) return;
    const t = setTimeout(commitFlip, 1400);
    return () => clearTimeout(t);
  }, [flip, commitFlip]);

  /* Jump to the first highlighted verse once pagination is ready. */
  useEffect(() => {
    const fv = focusVerseRef.current;
    if (fv === null) return;
    const idx = pages.findIndex((pg) => pg.some((v) => v.verse === fv));
    focusVerseRef.current = null;
    if (idx >= 0) setView(Math.floor(idx / duo));
  }, [pages, duo]);

  /* Keep the view in range when the viewport mode changes. */
  useEffect(() => {
    setView((v) => Math.min(v, maxView));
  }, [maxView]);

  /* ─── Spread vs single page (matchMedia) ─────────────────────────────── */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsSpread(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* ─── Measure the page box to size pagination ────────────────────────── */
  useEffect(() => {
    const el = bookRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width < 60 || r.height < 60) return;
      const spread = r.width > 640;
      const pageW = spread ? r.width / 2 : r.width;
      const textW = pageW - 86; // paddings, gilded frame and gutter allowance
      const textH = r.height - 100; // running head + folio + paddings
      const cpl = Math.max(24, Math.floor(textW / (17 * 0.52)));
      const lines = Math.max(9, Math.floor(textH / (17 * 1.95)));
      setMetrics({ capacity: Math.max(260, lines * cpl), cpl });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ─── Keyboard turning ───────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        turnRef.current("next");
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        turnRef.current("prev");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ─── Resume where the reader last rested ────────────────────────────── */
  const bootedRef = useRef(false);
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    try {
      const rl = localStorage.getItem(RED_LETTER_KEY);
      if (rl !== null) setRedLetterOn(rl === "1");
    } catch {
      /* defaults hold */
    }
    if (!allowResume) return; // a deep link names the page explicitly
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as { b?: string; c?: number; t?: string };
      if (!p?.b || !Number.isInteger(p?.c) || !p?.t) return;
      const same =
        initialDoc &&
        p.b === initialDoc.bookId &&
        p.c === initialDoc.chapter &&
        p.t === initialDoc.translationId;
      if (!same) void loadChapter(p.b, p.c as number, p.t as string);
    } catch {
      /* corrupted storage — start from John 1 */
    }
  }, [loadChapter, initialDoc, allowResume]);

  /* ─── Quietly ink the neighbouring chapters — "Next" feels instant ──── */
  useEffect(() => {
    if (!doc?.verses.length) return;
    const t = doc.translationId;
    const next = nextChapterOf(doc.bookId, doc.chapter);
    const prev = prevChapterOf(doc.bookId, doc.chapter);
    const t1 = window.setTimeout(() => {
      if (next) void prefetchChapter(t, next.bookId, next.chapter);
    }, 1200);
    const t2 = window.setTimeout(() => {
      if (prev) void prefetchChapter(t, prev.bookId, prev.chapter);
    }, 3400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [doc]);

  const toggleRedLetter = useCallback(() => {
    setRedLetterOn((on) => {
      const next = !on;
      try {
        localStorage.setItem(RED_LETTER_KEY, next ? "1" : "0");
      } catch {
        /* preference is best-effort */
      }
      return next;
    });
  }, []);

  /* ─── Graphics mode — full gilding vs. lite pages ─────────────────── */
  const setFx = useCallback((mode: FxMode) => {
    setFxMode(mode);
    try {
      localStorage.setItem(FX_KEY, mode);
    } catch {
      /* preference is best-effort */
    }
  }, []);

  useEffect(() => {
    fxLiteRef.current = fxLite;
  }, [fxLite]);

  const fxBootedRef = useRef(false);
  useEffect(() => {
    if (fxBootedRef.current) return;
    fxBootedRef.current = true;
    const id = window.setTimeout(() => {
      let probeLite = false;
      try {
        // The first-visit frame-rate probe (PerfProbe) may have convicted this
        // device in an earlier visit — honour its verdict from the shelf.
        probeLite = localStorage.getItem(PERF_LITE_KEY) === "1";
      } catch {
        /* storage unavailable — heuristics hold */
      }
      setDeviceLite(probeLite || devicePrefersLite());
      try {
        const raw = localStorage.getItem(FX_KEY);
        if (raw === "rich" || raw === "lite" || raw === "auto") setFxMode(raw);
      } catch {
        /* auto stays */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  /* Mid-session conviction: the probe fired while the visitor is here. */
  useEffect(() => {
    const drop = () => setDeviceLite(true);
    window.addEventListener(PERF_LITE_EVENT, drop);
    return () => window.removeEventListener(PERF_LITE_EVENT, drop);
  }, []);

  /* ─── Cover ──────────────────────────────────────────────────────────── */
  const openCover = useCallback(() => {
    coverRef.current = "opening";
    setCoverState("opening");
    try {
      sessionStorage.setItem(OPEN_KEY, "1");
    } catch {
      /* the cover simply re-greets next visit */
    }
    // Lite mode recedes in under half a second; the leather swing takes 1.45s.
    setTimeout(() => {
      coverRef.current = "open";
      setCoverState("open");
    }, fxLiteRef.current ? 480 : 1450);
  }, []);

  /* A returning reader in the same session finds the book already open. */
  useEffect(() => {
    try {
      if (sessionStorage.getItem(OPEN_KEY) === "1") {
        coverRef.current = "open";
        setCoverState("open");
      }
    } catch {
      /* first visit in this session — the cover greets */
    }
  }, []);

  /* ─── Handlers ───────────────────────────────────────────────────────── */
  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading || flip) return;
    void loadReference(q, translation);
  };

  const changeBook = (bookId: string) => {
    if (loading || flip || bookId === doc?.bookId) return;
    narration.stop();
    void loadChapter(bookId, 1, translation);
  };

  const changeChapter = (chapter: string) => {
    if (!doc || loading || flip) return;
    narration.stop();
    void loadChapter(doc.bookId, Number(chapter), translation);
  };

  const changeTranslation = (tid: string) => {
    if (!doc || loading || flip || tid === doc.translationId) return;
    narration.stop();
    void loadChapter(doc.bookId, doc.chapter, tid);
  };

  const stepChapter = (dir: -1 | 1) => {
    if (!doc || loading || flip) return;
    narration.stop();
    if (dir === -1) {
      if (doc.chapter > 1) void loadChapter(doc.bookId, doc.chapter - 1, translation);
      else if (bookIndex > 0) {
        const prev = books[bookIndex - 1];
        void loadChapter(prev.id, prev.chapters, translation);
      }
    } else {
      if (bookMeta && doc.chapter < bookMeta.chapters) {
        void loadChapter(doc.bookId, doc.chapter + 1, translation);
      } else if (bookIndex >= 0 && bookIndex < books.length - 1) {
        void loadChapter(books[bookIndex + 1].id, 1, translation);
      }
    }
  };

  const chapterOptions = useMemo(
    () => Array.from({ length: bookMeta?.chapters ?? 0 }, (_, i) => i + 1),
    [bookMeta],
  );
  const otBooks = useMemo(() => books.filter((b) => b.testament === "OT"), [books]);
  const ntBooks = useMemo(() => books.filter((b) => b.testament === "NT"), [books]);

  const controlsBusy = loading || flip !== null;
  const leafLabel = duo === 2 ? "Leaf" : "Page";

  return (
    <div className="relative">
      {/* ─── Controls ─────────────────────────────────────────────────────── */}
      <div className="mb-7 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <form onSubmit={submitSearch} className="flex min-w-[250px] flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a reference — try “John 3:16” or “Psalm 23”"
                aria-label="Search the Bible by reference"
                className="h-9 rounded-full bg-card pl-9 text-sm"
                maxLength={80}
              />
            </div>
            <Button type="submit" size="sm" className="h-9 rounded-full px-4" disabled={controlsBusy || !query.trim()}>
              Search
            </Button>
          </form>

          <Select value={translation} onValueChange={changeTranslation} disabled={controlsBusy}>
            <SelectTrigger aria-label="Translation" className="h-9 w-[214px] overflow-hidden rounded-full bg-card text-sm">
              <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                <Languages className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>English</SelectLabel>
                {sortedTranslations
                  .filter((t) => t.language.toLowerCase().startsWith("english"))
                  .map((t) => (
                    <SelectItem key={t.identifier} value={t.identifier}>
                      {t.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Other languages</SelectLabel>
                {sortedTranslations
                  .filter((t) => !t.language.toLowerCase().startsWith("english"))
                  .map((t) => (
                    <SelectItem key={t.identifier} value={t.identifier}>
                      {t.name} · {t.language}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-full"
            disabled={controlsBusy}
            onClick={() => void loadRandom(translation)}
          >
            <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden />
            Surprise me
          </Button>

          {doc && RED_LETTER_BOOKS.has(doc.bookId) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={redLetterOn}
              title="Words of Christ in red"
              onClick={toggleRedLetter}
              className={cn(
                "h-9 rounded-full transition-colors",
                redLetterOn
                  ? "border-[#c04a3f]/40 bg-[#b3261e]/8 text-[#a8221b] hover:bg-[#b3261e]/14 dark:border-[#e0887e]/40 dark:bg-[#e07a6e]/10 dark:text-[#e5968b] dark:hover:bg-[#e07a6e]/16"
                  : "text-muted-foreground",
              )}
            >
              <Quote className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Red letter</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={fxLite}
            title={
              fxLite
                ? "Simpler pages for smooth reading on this device — click for the full gilded page-turn"
                : "Full gilded page-turn — click for lighter pages if this device stutters"
            }
            onClick={() => setFx(fxLite ? "rich" : "lite")}
            className={cn(
              "h-9 rounded-full transition-colors",
              fxLite ? "border-gold/40 bg-gold/10 text-gold-foreground dark:text-gold" : "text-muted-foreground",
            )}
          >
            <Feather className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">{fxLite ? "Lite pages" : "Gilded pages"}</span>
          </Button>

          {narration.supported && doc?.verses.length ? (
            <div className="flex items-center gap-2">
              {narration.state === "playing" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full"
                  onClick={narration.pause}
                  aria-label="Pause narration"
                >
                  <Pause className="h-3.5 w-3.5 text-gold" aria-hidden />
                  <span className="hidden sm:inline">Pause</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full"
                  onClick={() => {
                    if (!doc) return;
                    if (narration.state === "paused") narration.resume();
                    else narration.play(doc.verses, speechLang(doc.translationId, translations));
                  }}
                  aria-label={narration.state === "paused" ? "Resume narration" : "Listen to this chapter"}
                >
                  <Volume2 className="h-3.5 w-3.5 text-gold" aria-hidden />
                  <span className="hidden sm:inline">{narration.state === "paused" ? "Resume" : "Listen"}</span>
                </Button>
              )}
              {narration.state !== "idle" && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={narration.stop}
                  aria-label="Stop narration"
                >
                  <Square className="h-3.5 w-3.5" aria-hidden />
                </Button>
              )}
              <Select
                value={String(narration.rate)}
                onValueChange={(v) => narration.changeRate(Number(v) as NarrationRate)}
              >
                <SelectTrigger aria-label="Narration speed" className="h-9 w-[84px] overflow-hidden rounded-full bg-card text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.8">0.8×</SelectItem>
                  <SelectItem value="1">1×</SelectItem>
                  <SelectItem value="1.25">1.25×</SelectItem>
                </SelectContent>
              </Select>
              {(() => {
                const activeLangPrefix = speechLang(doc.translationId, translations).split("-")[0].toLowerCase();
                const matchingVoices = narration.voices.filter((v) =>
                  v.lang.toLowerCase().startsWith(activeLangPrefix),
                );
                const otherVoices = narration.voices.filter(
                  (v) => !v.lang.toLowerCase().startsWith(activeLangPrefix),
                );
                const selectedVoiceValue =
                  narration.voiceId.startsWith("sys:") &&
                  !narration.voices.some((v) => `sys:${v.voiceURI}` === narration.voiceId)
                    ? "preset:auto"
                    : narration.voiceId;
                return (
                  <Select value={selectedVoiceValue} onValueChange={narration.changeVoice}>
                    <SelectTrigger
                      aria-label="Narration voice"
                      className="h-9 w-[164px] overflow-hidden rounded-full bg-card text-sm"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                        <AudioLines className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
                        <SelectValue placeholder="Voice" />
                      </span>
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      <SelectGroup>
                        <SelectLabel>Reading styles</SelectLabel>
                        {VOICE_PRESETS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {matchingVoices.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Language voices</SelectLabel>
                          {matchingVoices.map((v) => (
                            <SelectItem key={v.voiceURI} value={`sys:${v.voiceURI}`}>
                              {v.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {otherVoices.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Other voices</SelectLabel>
                          {otherVoices.slice(0, 20).map((v) => (
                            <SelectItem key={v.voiceURI} value={`sys:${v.voiceURI}`}>
                              {v.name} ({v.lang})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                );
              })()}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={doc?.bookId ?? ""} onValueChange={changeBook} disabled={controlsBusy}>
            <SelectTrigger aria-label="Book" className="h-9 w-[168px] overflow-hidden rounded-full bg-card text-sm">
              <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                <BookOpen className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
                <SelectValue placeholder="Book" />
              </span>
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectGroup>
                <SelectLabel>Old Testament</SelectLabel>
                {otBooks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>New Testament</SelectLabel>
                {ntBooks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={doc ? String(doc.chapter) : ""}
            onValueChange={changeChapter}
            disabled={controlsBusy || !doc}
          >
            <SelectTrigger aria-label="Chapter" className="h-9 w-[112px] rounded-full bg-card text-sm">
              <SelectValue placeholder="Ch." />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {chapterOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  Chapter {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              aria-label="Previous chapter"
              disabled={controlsBusy || !doc || (doc.chapter === 1 && bookIndex <= 0)}
              onClick={() => stepChapter(-1)}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              aria-label="Next chapter"
              disabled={
                controlsBusy ||
                !doc ||
                (bookIndex === books.length - 1 && !!bookMeta && doc.chapter >= bookMeta.chapters)
              }
              onClick={() => stepChapter(1)}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── The book ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "rounded-xl",
          "shadow-[0_30px_80px_-30px_rgb(15_25_44/0.45)]",
        )}
      >
        <BookSpread
          bookRef={bookRef as RefObject<HTMLDivElement | null>}
          doc={
            doc ?? {
              translationId: "kjv",
              translationName: "King James Version",
              licenseNote: "Public Domain",
              bookId: "JHN",
              bookName: "John",
              chapter: 1,
              verses: [],
              highlight: [],
            }
          }
          pages={doc ? pages : [[]]}
          duo={duo}
          view={Math.min(view, maxView)}
          flip={flip}
          onFlipDone={commitFlip}
          loading={loading}
          error={error}
          onRetry={() => void loadChapter("JHN", 1, translation)}
          coverState={coverState}
          onOpenCover={openCover}
          redLetterOn={redLetterOn}
          speakingVerse={narration.currentVerse}
          fxLite={fxLite}
          fadeKey={arriveKey}
        />
      </div>

      {/* ─── Page-turn pager ─────────────────────────────────────────── */}
      <div className="mt-5 flex items-center justify-center gap-5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full bg-card"
          aria-label="Turn back a page"
          disabled={view <= 0 || controlsBusy}
          onClick={() => turn("prev")}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>
        <span
          aria-live="polite"
          className="min-w-[150px] text-center font-mono text-[11px] tracking-[0.24em] text-muted-foreground uppercase"
        >
          {doc ? `${leafLabel} ${view + 1} of ${maxView + 1}` : "—"}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full bg-card"
          aria-label="Turn forward a page"
          disabled={view >= maxView || controlsBusy}
          onClick={() => turn("next")}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {/* ─── Attribution & hints ──────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col items-center gap-1.5 text-center">
        <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
          {doc ? `${doc.translationName} · ${doc.licenseNote}` : "King James Version · Public Domain"}
          {" — passage text courtesy of "}
          <a
            href="https://bible-api.com"
            target="_blank"
            rel="noreferrer noopener"
            className="underline decoration-gold/50 underline-offset-2 transition-colors hover:text-gold-foreground dark:hover:text-gold"
          >
            bible-api.com
          </a>
        </p>
        {doc?.note && <p className="text-xs italic text-gold-foreground dark:text-gold/90">{doc.note}</p>}
        {narration.state !== "idle" && narration.currentVerse !== null && (
          <p aria-live="polite" className="font-mono text-[11px] tracking-wide text-gold-foreground dark:text-gold">
            Read aloud — {doc?.bookName} {doc?.chapter}, verse {narration.currentVerse}
          </p>
        )}
        <p className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground/70 uppercase">
          Turn pages with the arrow keys
        </p>
      </div>
    </div>
  );
}
