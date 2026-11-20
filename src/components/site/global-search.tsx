"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Loader2,
  MessageSquareQuote,
  Music2,
  Pause,
  Play,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/music/player-provider";
import { splitHighlightSegments, type GlobalSearchResponse } from "@/lib/search";

type ScopeTab = "all" | "verses" | "posts" | "tracks";

type FlatResult =
  | { key: string; kind: "bible"; href: string }
  | { key: string; kind: "verse"; href: string }
  | { key: string; kind: "post"; href: string }
  | { key: string; kind: "track"; href: string; trackId: string };

const QUICK_SUGGESTIONS = [
  { label: "Psalm 23", hint: "Scripture & song" },
  { label: "anxiety", hint: "Verses & stories" },
  { label: "forgiveness", hint: "Verses & community" },
  { label: "Still Waters", hint: "Instrumental" },
];

function isEditableElement(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

function fmtSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const segments = splitHighlightSegments(text, query);
  return (
    <>
      {segments.map((seg, idx) =>
        seg.match ? (
          <mark
            key={idx}
            className="rounded-[3px] bg-gold/28 px-0.5 font-semibold text-foreground dark:bg-gold/30 dark:text-foreground"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={idx}>{seg.text}</span>
        )
      )}
    </>
  );
}

export function GlobalSearch() {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  const { tracks: playerTracks, current: playingTrack, isPlaying, playTrackAt, toggle } = usePlayer();

  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ScopeTab>("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = query.trim();

  const closeSearch = useCallback(() => {
    setOpen(false);
    setMobileExpanded(false);
    setActiveIndex(-1);
  }, []);

  // Global keyboard shortcuts: Cmd/Ctrl+K or "/" focuses the header search bar
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        if (window.matchMedia("(min-width: 1024px)").matches) {
          desktopInputRef.current?.focus();
          desktopInputRef.current?.select();
        } else {
          setMobileExpanded(true);
          window.setTimeout(() => mobileInputRef.current?.focus(), 0);
        }
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !isEditableElement(e.target)) {
        e.preventDefault();
        setOpen(true);
        if (window.matchMedia("(min-width: 1024px)").matches) {
          desktopInputRef.current?.focus();
        } else {
          setMobileExpanded(true);
          window.setTimeout(() => mobileInputRef.current?.focus(), 0);
        }
      } else if (e.key === "Escape" && (open || mobileExpanded)) {
        closeSearch();
        desktopInputRef.current?.blur();
        mobileInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, mobileExpanded, closeSearch]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!open && !mobileExpanded) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, mobileExpanded, closeSearch]);

  // Debounced search against /api/search with abort cancellation
  useEffect(() => {
    if (!trimmed) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as GlobalSearchResponse;
        if (!controller.signal.aborted) {
          setResults(data);
          setError(null);
          setLoading(false);
          setActiveIndex(0);
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setError("Search is briefly unavailable — please try again.");
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const handleQueryChange = useCallback((next: string) => {
    setQuery(next);
    setOpen(true);
    setActiveIndex(-1);
    if (!next.trim()) {
      setResults(null);
      setError(null);
      setLoading(false);
    } else {
      setLoading(true);
      setError(null);
    }
  }, []);

  const showVerses = scope === "all" || scope === "verses";
  const showPosts = scope === "all" || scope === "posts";
  const showTracks = scope === "all" || scope === "tracks";

  const visibleBibleJump = showVerses ? results?.bibleJump ?? null : null;
  const visibleVerses = useMemo(() => {
    if (!showVerses) return [];
    const list = results?.verses ?? [];
    return scope === "all" ? list.slice(0, visibleBibleJump ? 2 : 3) : list;
  }, [showVerses, scope, visibleBibleJump, results]);
  const visiblePosts = useMemo(() => {
    if (!showPosts) return [];
    const list = results?.posts ?? [];
    return scope === "all" ? list.slice(0, 2) : list;
  }, [showPosts, scope, results]);
  const visibleTracks = useMemo(() => {
    if (!showTracks) return [];
    const list = results?.tracks ?? [];
    return scope === "all" ? list.slice(0, 2) : list;
  }, [showTracks, scope, results]);

  const flatResults = useMemo<FlatResult[]>(() => {
    const list: FlatResult[] = [];
    if (visibleBibleJump) {
      list.push({ key: `bible:${visibleBibleJump.href}`, kind: "bible", href: visibleBibleJump.href });
    }
    for (const v of visibleVerses) {
      list.push({ key: `verse:${v.theme}:${v.ref}`, kind: "verse", href: v.href });
    }
    for (const p of visiblePosts) {
      list.push({ key: `post:${p.id}`, kind: "post", href: p.href });
    }
    for (const t of visibleTracks) {
      list.push({ key: `track:${t.id}`, kind: "track", href: t.href, trackId: t.id });
    }
    return list;
  }, [visibleBibleJump, visibleVerses, visiblePosts, visibleTracks]);

  const navigateTo = useCallback(
    (href: string) => {
      closeSearch();
      router.push(href);
    },
    [closeSearch, router]
  );

  const handlePlayTrack = useCallback(
    (trackId: string) => {
      const idx = playerTracks.findIndex((t) => t.id === trackId);
      if (idx >= 0) {
        if (playingTrack?.id === trackId) {
          toggle();
        } else {
          playTrackAt(idx);
        }
      } else {
        navigateTo("/music");
      }
    },
    [playerTracks, playingTrack, toggle, playTrackAt, navigateTo]
  );

  const onInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        if (flatResults.length === 0) return;
        e.preventDefault();
        setOpen(true);
        setActiveIndex((prev) => (prev + 1) % flatResults.length);
      } else if (e.key === "ArrowUp") {
        if (flatResults.length === 0) return;
        e.preventDefault();
        setOpen(true);
        setActiveIndex((prev) => (prev <= 0 ? flatResults.length - 1 : prev - 1));
      } else if (e.key === "Enter" && flatResults.length > 0) {
        e.preventDefault();
        const picked = flatResults[activeIndex >= 0 && activeIndex < flatResults.length ? activeIndex : 0];
        if (picked) navigateTo(picked.href);
      }
    },
    [flatResults, activeIndex, navigateTo]
  );

  const verseCount = (results?.bibleJump ? 1 : 0) + (results?.verses.length ?? 0);
  const postCount = results?.posts.length ?? 0;
  const trackCount = results?.tracks.length ?? 0;
  const totalCount = verseCount + postCount + trackCount;

  const visibleCount =
    (visibleBibleJump ? 1 : 0) + visibleVerses.length + visiblePosts.length + visibleTracks.length;

  const highlightQuery = results?.query || trimmed;
  let flatCursor = -1;

  const renderPanel = () => (
    <div
      id={listboxId}
      role="region"
      aria-label="Global search results"
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-popover/98 text-popover-foreground backdrop-blur-xl",
        "shadow-[0_24px_64px_-20px_rgb(15_25_44/0.35)] dark:shadow-[0_24px_64px_-16px_rgb(0_0_0/0.65)]"
      )}
    >
      {/* Scope filter tabs when a query is active */}
      {trimmed ? (
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
          <div className="flex flex-wrap items-center gap-0.5 sm:gap-1" role="tablist" aria-label="Filter search results">
            {(
              [
                { key: "all", label: "All", count: totalCount },
                { key: "verses", label: "Verses", count: verseCount },
                { key: "posts", label: "Community", count: postCount },
                { key: "tracks", label: "Music", count: trackCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={scope === tab.key}
                onClick={() => {
                  setScope(tab.key);
                  setActiveIndex(0);
                }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors sm:gap-1.5 sm:px-2.5 sm:text-xs",
                  scope === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span>{tab.label}</span>
                {results ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px]",
                      scope === tab.key ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-gold" aria-label="Searching" />
          ) : null}
        </div>
      ) : null}

      {/* Scrollable body */}
      <div className="slim-scroll max-h-[min(68vh,460px)] overflow-y-auto p-2">
        {!trimmed ? (
          <div className="p-2">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Quick search
            </p>
            <p className="mt-1 px-2 text-xs text-muted-foreground">
              Find Bible verses, community testimonies &amp; prayers, or worship instrumentals.
            </p>
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    handleQueryChange(s.label);
                    if (mobileExpanded) mobileInputRef.current?.focus();
                    else desktopInputRef.current?.focus();
                  }}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card/70 px-3 py-2 text-left text-sm transition-colors hover:border-gold/50 hover:bg-accent/60"
                >
                  <span className="font-medium text-foreground">{s.label}</span>
                  <span className="text-[11px] text-muted-foreground">{s.hint}</span>
                </button>
              ))}
            </div>
          </div>
        ) : error ? (
          <p className="px-3 py-6 text-center text-sm text-destructive">{error}</p>
        ) : loading && !results ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden />
            Searching Scriptures, community, and music…
          </div>
        ) : visibleCount === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="font-display text-base font-medium text-foreground">
              No matches for &ldquo;{trimmed}&rdquo;
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a Bible reference (like &ldquo;John 3:16&rdquo;), a theme (like &ldquo;peace&rdquo; or &ldquo;anxiety&rdquo;), or a track name.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Direct Bible Reader jump + Curated Verses */}
            {(visibleBibleJump || visibleVerses.length > 0) && (
              <section aria-label="Bible verses">
                <div className="flex items-center justify-between px-2 pb-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-foreground dark:text-gold">
                    <BookOpen className="h-3.5 w-3.5 text-gold" aria-hidden />
                    Bible &amp; Verses
                  </span>
                  <button
                    type="button"
                    onClick={() => navigateTo(`/verses?q=${encodeURIComponent(trimmed)}`)}
                    className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    All verses →
                  </button>
                </div>

                <ul className="space-y-1">
                  {visibleBibleJump ? (
                    (() => {
                      flatCursor += 1;
                      const idx = flatCursor;
                      const selected = activeIndex === idx;
                      return (
                        <li key={`jump-${visibleBibleJump.href}`}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => navigateTo(visibleBibleJump.href)}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/8 px-3 py-2.5 text-left transition-colors",
                              selected ? "bg-accent border-gold/60" : "hover:bg-accent/70"
                            )}
                          >
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
                                Open {visibleBibleJump.label} in Bible Reader
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Turn directly to {visibleBibleJump.bookName} chapter {visibleBibleJump.chapter}
                                {visibleBibleJump.verse ? `, verse ${visibleBibleJump.verse}` : ""}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                          </button>
                        </li>
                      );
                    })()
                  ) : null}

                  {visibleVerses.map((v) => {
                    flatCursor += 1;
                    const idx = flatCursor;
                    const selected = activeIndex === idx;
                    return (
                      <li key={`${v.theme}-${v.ref}`}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => navigateTo(v.href)}
                          className={cn(
                            "flex w-full flex-col rounded-xl px-3 py-2 text-left transition-colors",
                            selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display text-sm font-semibold text-foreground">
                              <HighlightedText text={v.ref} query={highlightQuery} />
                            </span>
                            <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold-foreground dark:text-gold">
                              {v.themeLabel}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            &ldquo;<HighlightedText text={v.text} query={highlightQuery} />&rdquo;
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Community Posts */}
            {visiblePosts.length > 0 && (
              <section aria-label="Community posts">
                <div className="flex items-center justify-between px-2 pb-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-foreground dark:text-gold">
                    <MessageSquareQuote className="h-3.5 w-3.5 text-gold" aria-hidden />
                    Community
                  </span>
                  <button
                    type="button"
                    onClick={() => navigateTo("/community")}
                    className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Courtyard →
                  </button>
                </div>

                <ul className="space-y-1">
                  {visiblePosts.map((p) => {
                    flatCursor += 1;
                    const idx = flatCursor;
                    const selected = activeIndex === idx;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => navigateTo(p.href)}
                          className={cn(
                            "flex w-full flex-col rounded-xl px-3 py-2 text-left transition-colors",
                            selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-display text-sm font-semibold text-foreground">
                              <HighlightedText text={p.title} query={highlightQuery} />
                            </span>
                            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                              {p.categoryLabel}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            <HighlightedText text={p.excerpt} query={highlightQuery} />
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Worship Instrumentals */}
            {visibleTracks.length > 0 && (
              <section aria-label="Worship instrumentals">
                <div className="flex items-center justify-between px-2 pb-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-foreground dark:text-gold">
                    <Music2 className="h-3.5 w-3.5 text-gold" aria-hidden />
                    Worship Instrumentals
                  </span>
                  <button
                    type="button"
                    onClick={() => navigateTo("/music")}
                    className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Music room →
                  </button>
                </div>

                <ul className="space-y-1">
                  {visibleTracks.map((t) => {
                    flatCursor += 1;
                    const idx = flatCursor;
                    const selected = activeIndex === idx;
                    const isThisPlaying = playingTrack?.id === t.id && isPlaying;

                    return (
                      <li
                        key={t.id}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors",
                          selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                        )}
                      >
                        <Button
                          type="button"
                          size="icon"
                          variant={isThisPlaying ? "default" : "outline"}
                          className="h-8 w-8 shrink-0 rounded-full"
                          aria-label={isThisPlaying ? `Pause ${t.title}` : `Play ${t.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayTrack(t.id);
                          }}
                        >
                          {isThisPlaying ? (
                            <Pause className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <Play className="h-3.5 w-3.5 translate-x-[1px]" aria-hidden />
                          )}
                        </Button>
                        <button
                          type="button"
                          onClick={() => navigateTo(t.href)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-display text-sm font-semibold text-foreground">
                              {t.title}
                            </span>
                            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                              {fmtSec(t.durationSec)}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {t.scripture ? `${t.scripture} · ` : ""}
                            {t.album}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Subtle keyboard footer */}
      <div className="hidden items-center justify-between border-t border-border/50 bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground sm:flex">
        <span>↑↓ to move · Enter to open · Esc to close</span>
        <span>Press / anytime</span>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Desktop inline search bar (lg+) */}
      <div className="relative hidden lg:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          ref={desktopInputRef}
          type="search"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder="Search verses, posts, music…"
          aria-label="Search Bible verses, community posts, or music"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          role="combobox"
          aria-autocomplete="list"
          className={cn(
            "h-9 w-48 rounded-full border border-border/80 bg-card/85 pl-8.5 pr-12 text-[0.84rem] text-foreground placeholder:text-muted-foreground/80 transition-all xl:w-60",
            "focus:w-64 focus:border-gold/70 focus:bg-card focus:outline-none focus:ring-2 focus:ring-gold/30 xl:focus:w-72",
            "[&::-webkit-search-cancel-button]:hidden"
          )}
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              handleQueryChange("");
              desktopInputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : (
          <kbd
            aria-hidden
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border/70 bg-muted/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
          >
            /
          </kbd>
        )}

        {open && !mobileExpanded ? (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(92vw,460px)]">
            {renderPanel()}
          </div>
        ) : null}
      </div>

      {/* Compact trigger for mobile & tablet (< lg) */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={mobileExpanded ? "Close search" : "Open search"}
        aria-expanded={mobileExpanded}
        className="rounded-full lg:hidden"
        onClick={() => {
          setMobileExpanded((prev) => {
            const next = !prev;
            setOpen(next);
            if (next) window.setTimeout(() => mobileInputRef.current?.focus(), 0);
            return next;
          });
        }}
      >
        {mobileExpanded ? <X className="h-4 w-4" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
      </Button>

      {/* Expandable full-width search bar + panel for mobile & tablet (< lg) */}
      {mobileExpanded ? (
        <div className="fixed inset-x-0 top-16 z-50 border-b border-border/70 bg-background/95 px-3 pb-3 pt-2.5 backdrop-blur-xl lg:hidden">
          <div className="mx-auto max-w-xl space-y-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                ref={mobileInputRef}
                type="search"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search verses, posts, music…"
                aria-label="Search Bible verses, community posts, or music"
                className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold/70 focus:outline-none focus:ring-2 focus:ring-gold/30 [&::-webkit-search-cancel-button]:hidden"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    handleQueryChange("");
                    mobileInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </div>
            {renderPanel()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
