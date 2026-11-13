"use client";

import { type MouseEvent, type RefObject } from "react";
import { BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isWordOfChrist } from "@/lib/bible/red-letter";
import type { ReaderDoc, ReaderVerse } from "./types";

/* ─── Verse text with an illuminated drop cap at chapter openings ───────── */

function VerseText({ text, dropcap }: { text: string; dropcap: boolean }) {
  if (!dropcap || !text) return <>{text}</>;
  const first = [...text][0];
  const rest = text.slice(first.length);
  return (
    <>
      <span className="bible-dropcap">{first}</span>
      {rest}
    </>
  );
}

/* ─── One sheet of paper ─────────────────────────────────────────────────── */

function BiblePage({
  doc,
  verses,
  side,
  pageNumber,
  totalPages,
  anchor,
  redLetterOn,
  speakingVerse,
}: {
  doc: ReaderDoc;
  verses: ReaderVerse[] | null;
  side: "left" | "right";
  pageNumber: number;
  totalPages: number;
  anchor: number | null;
  redLetterOn: boolean;
  speakingVerse: number | null;
}) {
  const blank = !verses || verses.length === 0;
  const opensChapter = !blank && verses[0].verse === 1;
  const highlight = new Set(doc.highlight);

  return (
    <article
      className={cn("bible-page", blank && "blank")}
      aria-label={
        blank
          ? `Blank page ${pageNumber} of ${totalPages}`
          : `${doc.bookName} ${doc.chapter} — page ${pageNumber} of ${totalPages}`
      }
    >
      <span aria-hidden className="frame-outer" />
      <span aria-hidden className="frame-inner" />
      <header className="bible-runninghead">
        <span>{side === "left" ? doc.translationName : `${doc.bookName} · Chapter ${doc.chapter}`}</span>
      </header>
      <div className="bible-page-inner">
        {blank ? (
          <span
            aria-hidden
            className="bible-blank-ornament"
            style={{ background: "linear-gradient(135deg, var(--gold-foil), transparent)" }}
          />
        ) : (
          verses.map((v) => (
            <p
              key={v.verse}
              className={cn(
                "bible-verse",
                highlight.has(v.verse) && "hl",
                anchor === v.verse && "anchor",
                redLetterOn && isWordOfChrist(doc.bookId, v.chapter, v.verse) && "words",
                speakingVerse === v.verse && "speaking",
              )}
            >
              <sup className="bible-vnum" aria-label={`Verse ${v.verse}`}>{v.verse}</sup>
              <VerseText text={v.text} dropcap={opensChapter && v === verses[0]} />
            </p>
          ))
        )}
      </div>
      <footer className="bible-folio" aria-hidden>
        <span className="dot" />
        <span>{pageNumber}</span>
        <span className="dot" />
      </footer>
    </article>
  );
}

/* ─── The closed leather cover ──────────────────────────────────────────── */

function CrossMedallion() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" stroke="url(#bible-cover-gold)" strokeWidth="1.4" opacity="0.85" />
      <circle cx="32" cy="32" r="25.5" stroke="url(#bible-cover-gold)" strokeWidth="0.7" opacity="0.5" />
      <path d="M32 14v36M22.5 26h19" stroke="url(#bible-cover-gold)" strokeWidth="2.6" strokeLinecap="round" />
      <defs>
        <linearGradient id="bible-cover-gold" x1="0" y1="6" x2="0" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F4D895" />
          <stop offset="1" stopColor="#B98B33" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Cover({ state, onOpen }: { state: "closed" | "opening" | "open"; onOpen: () => void }) {
  if (state === "open") return null;
  const handle = (e: MouseEvent) => {
    e.preventDefault();
    if (state === "closed") onOpen();
  };
  return (
    <div
      className={cn("bible-cover", state === "opening" && "opening")}
      onClick={handle}
      role={state === "closed" ? "button" : undefined}
      tabIndex={state === "closed" ? 0 : -1}
      aria-label="Open the Bible"
      aria-hidden={state !== "closed" || undefined}
      onKeyDown={(e) => {
        if (state === "closed" && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <span aria-hidden className="foil-frame" />
      <CrossMedallion />
      <h2 className="bible-cover-title">HOLY BIBLE</h2>
      <div aria-hidden className="flex items-center gap-3">
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#d6ab58]/60" />
        <span className="h-1.5 w-1.5 rotate-45 bg-[#d6ab58]/70" />
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#d6ab58]/60" />
      </div>
      <p className="bible-cover-sub">Daily Dose of Gospels · Reader</p>
      <span className="open-hint">
        <BookOpen className="h-3.5 w-3.5" aria-hidden />
        Open the Bible
      </span>
    </div>
  );
}

/* ─── Loading / error veil ──────────────────────────────────────────────── */

function Veil({ error, busy, onRetry }: { error: string | null; busy: boolean; onRetry: () => void }) {
  return (
    <div className="bible-veil" role="status" aria-live="polite">
      {error ? (
        <>
          <RotateCcw className="h-5 w-5 text-[#b98b33]" aria-hidden />
          <p className="max-w-sm text-center text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            {error}
          </p>
          <Button size="sm" variant="outline" onClick={onRetry} className="mt-1">
            Try again
          </Button>
        </>
      ) : busy ? (
        <>
          <span className="bible-spinner" aria-hidden />
          <span className="bible-veil-label">Turning the page</span>
        </>
      ) : null}
    </div>
  );
}

/* ─── The spread itself ─────────────────────────────────────────────────── */

export type FlipState = { dir: "next" | "prev"; target: number } | null;

export function BookSpread({
  doc,
  pages,
  duo,
  view,
  flip,
  onFlipDone,
  loading,
  error,
  onRetry,
  coverState,
  onOpenCover,
  bookRef,
  redLetterOn,
  speakingVerse,
  fxLite,
  fadeKey,
}: {
  doc: ReaderDoc;
  pages: ReaderVerse[][];
  duo: 1 | 2;
  view: number;
  flip: FlipState;
  onFlipDone: () => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  coverState: "closed" | "opening" | "open";
  onOpenCover: () => void;
  bookRef?: RefObject<HTMLDivElement | null>;
  redLetterOn: boolean;
  speakingVerse: number | null;
  /** Lite graphics mode — no 3D sheets; pages arrive with a quiet fade. */
  fxLite: boolean;
  /** Bumped on every page/chapter change to replay the lite fade. */
  fadeKey: number;
}) {
  const maxView = Math.max(0, Math.ceil(pages.length / duo) - 1);
  /* First highlighted verse gets the golden flash on arrival. */
  const anchor = doc.highlight.length ? Math.min(...doc.highlight) : null;

  /* Underlay slots — during a flip they already show the landing state. */
  let underLeft: number | null;
  let underRight: number | null;
  if (!flip) {
    underLeft = duo === 2 ? view * 2 : null;
    underRight = duo === 2 ? view * 2 + 1 : view;
  } else if (duo === 1) {
    underLeft = null;
    underRight = flip.target;
  } else if (flip.dir === "next") {
    underLeft = view * 2;
    underRight = flip.target * 2 + 1;
  } else {
    underLeft = flip.target * 2;
    underRight = view * 2 + 1;
  }

  /* Sheet faces — the page that lifts, and the page that lands. */
  let frontIdx: number | null = null;
  let backIdx: number | null = null;
  if (flip) {
    if (duo === 1) {
      frontIdx = view;
      backIdx = flip.target;
    } else if (flip.dir === "next") {
      frontIdx = view * 2 + 1;
      backIdx = flip.target * 2;
    } else {
      frontIdx = view * 2;
      backIdx = flip.target * 2 + 1;
    }
  }

  const totalPages = pages.length || 1;

  return (
    <div className={cn("bible-stage", duo === 2 ? "mode-spread" : "mode-single", fxLite && "fx-lite")}>
      <div className="bible-book" data-testid="bible-book" ref={bookRef}>
        <span aria-hidden className="bible-edge left" />
        <span aria-hidden className="bible-edge right" />

        {/* Underlay pages — in lite mode each arrival fades in (keyed) */}
        {underLeft !== null && (
          <div className="bible-slot at-left" key={fxLite ? `l${fadeKey}` : undefined}>
            <BiblePage
              doc={doc}
              verses={pages[underLeft] ?? null}
              side="left"
              pageNumber={underLeft + 1}
              totalPages={totalPages}
              anchor={anchor}
              redLetterOn={redLetterOn}
              speakingVerse={speakingVerse}
            />
          </div>
        )}
        {underRight !== null && (
          <div className="bible-slot at-right" key={fxLite ? `r${fadeKey}` : undefined}>
            <BiblePage
              doc={doc}
              verses={pages[underRight] ?? null}
              side="right"
              pageNumber={underRight + 1}
              totalPages={totalPages}
              anchor={anchor}
              redLetterOn={redLetterOn}
              speakingVerse={speakingVerse}
            />
          </div>
        )}

        {/* Ribbon bookmark */}
        <span aria-hidden className="bible-ribbon" />

        {/* Flipping sheet */}
        {flip && (
          <div
            className={cn(
              "bible-sheet",
              duo === 2
                ? flip.dir === "next"
                  ? "axis-y at-right"
                  : "axis-y at-left"
                : "axis-x",
              flip.dir === "next" ? "turn-next" : "turn-prev",
            )}
            onAnimationEnd={(e) => {
              if (typeof e.animationName === "string" && e.animationName.startsWith("ddog-flip")) {
                onFlipDone();
              }
            }}
          >
            <div className="bible-face front">
              <BiblePage
                doc={doc}
                verses={frontIdx !== null ? pages[frontIdx] ?? null : null}
                side={duo === 2 && flip.dir === "next" ? "right" : "left"}
                pageNumber={(frontIdx ?? 0) + 1}
                totalPages={totalPages}
                anchor={null}
                redLetterOn={redLetterOn}
                speakingVerse={null}
              />
            </div>
            <div className="bible-face back">
              <BiblePage
                doc={doc}
                verses={backIdx !== null ? pages[backIdx] ?? null : null}
                side={duo === 2 ? (flip.dir === "next" ? "left" : "right") : "right"}
                pageNumber={(backIdx ?? 0) + 1}
                totalPages={totalPages}
                anchor={null}
                redLetterOn={redLetterOn}
                speakingVerse={null}
              />
            </div>
            <span aria-hidden className="bible-sheet-shade" />
          </div>
        )}

        {/* Loading / error veil */}
        {(loading || error) && <Veil error={error} busy={loading} onRetry={onRetry} />}

        {/* The closed cover */}
        <Cover state={coverState} onOpen={onOpenCover} />
      </div>
    </div>
  );
}
