"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const SEEN_KEY = "ddog-intro-seen-v1";

const TITLE_WORDS = ["Daily", "Dose", "of", "Gospels"];

const EASE_OUT = [0.21, 0.47, 0.32, 0.98] as const;
const EASE_CURTAIN = [0.76, 0, 0.24, 1] as const;

/**
 * CinematicIntro — the site's opening credits.
 * A dark veil; a gold cross draws itself inside a slowly turning
 * scripture ring; the title rises word by word; a real verse from
 * John 1 glows; then the curtain lifts and the sanctuary is open.
 *
 * - First full load in a session: the full sequence (~3.6s).
 * - Later full loads: a short 250ms flourish.
 * - prefers-reduced-motion: skipped entirely.
 * - Skippable via the button or Escape.
 */
export function CinematicIntro() {
  const [phase, setPhase] = useState<"playing" | "leaving" | "gone">("playing");
  const reduce = useReducedMotion();

  // Schedule the sequence exactly once per mount. `useReducedMotion()` can
  // settle from null → false right after hydration; without this guard the
  // effect would re-run, read the freshly-written SEEN_KEY and wrongly skip
  // the full intro for everyone.
  const scheduled = useRef(false);
  useEffect(() => {
    if (scheduled.current) return;
    scheduled.current = true;

    const seen = typeof window !== "undefined" && sessionStorage.getItem(SEEN_KEY);
    const short = Boolean(seen) || Boolean(reduce);
    const exitAt = short ? 250 : 3600;
    const removeAt = short ? 1050 : 4700;

    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode — the intro simply plays each load */
    }

    const t1 = setTimeout(() => setPhase("leaving"), exitAt);
    const t2 = setTimeout(() => setPhase("gone"), removeAt);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhase("leaving");
    };
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("keydown", onKey);
    };
  }, [reduce]);

  // If the visitor prefers reduced motion, bail out of the full sequence
  // even if it was already scheduled before the flag settled.
  // (Deferred by one tick so the state update never runs synchronously
  // inside the effect body — same behavior, lint-clean.)
  useEffect(() => {
    if (!reduce || phase !== "playing") return;
    const t = setTimeout(() => setPhase("leaving"), 0);
    return () => clearTimeout(t);
  }, [reduce, phase]);

  // Scroll lock — THE critical part: lock the page only while the curtain
  // is fully down, and restore scrolling the instant the lift begins.
  // (The previous version restored body overflow only in a cleanup that ran
  // on unmount — which never happens, since this component stays mounted and
  // merely returns null — so pages stayed un-scrollable forever.)
  useEffect(() => {
    if (phase === "playing") {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [phase]);

  const skip = useCallback(() => setPhase("leaving"), []);

  // Once "leaving" is triggered early (skip), still honor the remove timer.
  useEffect(() => {
    if (phase !== "leaving") return;
    const t = setTimeout(() => setPhase("gone"), 1100);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <motion.div
      aria-hidden={phase !== "playing"}
      role="presentation"
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-deep text-deep-foreground"
      initial={{ y: 0 }}
      animate={{ y: phase === "leaving" ? "-100%" : 0 }}
      transition={{ duration: 1.0, ease: EASE_CURTAIN }}
    >
      {/* Golden edge that catches the light as the curtain lifts */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold shadow-[0_0_24px_4px_color-mix(in_oklab,var(--gold)_55%,transparent)]" />

      {/* Vignette so the center glows like a candle in a dark nave */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 42%, transparent 40%, rgb(0 0 0 / 0.45) 100%)",
        }}
      />

      <div
        className="relative flex flex-1 flex-col items-center justify-center px-6 text-center"
        aria-hidden
      >
        {/* Ring + drawn cross */}
        <div className="relative flex h-28 w-28 items-center justify-center">
          <motion.span
            className="spin-slower absolute inset-0 rounded-full border border-dashed border-gold/40"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: EASE_OUT }}
          />
          <svg
            viewBox="0 0 64 64"
            className="h-14 w-14"
            style={{ filter: "drop-shadow(0 0 14px color-mix(in oklab, var(--gold) 55%, transparent))" }}
          >
            <motion.path
              d="M32 6 V58"
              stroke="var(--gold)"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            />
            <motion.path
              d="M18 24 H46"
              stroke="var(--gold)"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.95, ease: "easeOut" }}
            />
          </svg>
        </div>

        {/* Eyebrow */}
        <motion.p
          className="mt-8 text-[11px] font-semibold uppercase tracking-[0.35em] text-gold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.15, ease: EASE_OUT }}
        >
          Fully anonymous · Christ-centered
        </motion.p>

        {/* Title — each word rises out of its own mask */}
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-6xl">
          {TITLE_WORDS.map((word, i) => (
            <span key={word} className="inline-block overflow-hidden pb-1 align-bottom">
              <motion.span
                className="inline-block"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.7, delay: 1.3 + i * 0.12, ease: EASE_OUT }}
              >
                {word}
                {i < TITLE_WORDS.length - 1 ? "\u00A0" : ""}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* Divider */}
        <motion.div
          className="mt-6 h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.85, ease: EASE_OUT }}
        />

        {/* A real verse — John 1:5 (KJV) */}
        <motion.blockquote
          className="mt-6 max-w-md"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.15, ease: EASE_OUT }}
        >
          <p className="font-display text-lg italic leading-relaxed text-deep-foreground/90 sm:text-xl">
            “And the light shineth in darkness; and the darkness comprehended it not.”
          </p>
          <footer className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold/90">
            John 1:5 · KJV
          </footer>
        </motion.blockquote>
      </div>

      {/* Bottom bar: progress line + skip */}
      <div className="relative flex items-center justify-end px-5 pb-5">
        <button
          type="button"
          onClick={skip}
          className="rounded-full border border-deep-foreground/25 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-deep-foreground/80 transition-colors hover:border-gold/70 hover:text-gold"
          aria-hidden={phase !== "playing"}
          tabIndex={phase === "playing" ? 0 : -1}
        >
          Skip intro
        </button>
      </div>
      <div className="relative mx-5 pb-6">
        <motion.div
          className="h-px bg-gold/70"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: phase === "playing" ? 1 : 1, opacity: phase === "playing" ? 1 : 0 }}
          transition={{ duration: 3.3, ease: "linear" }}
          style={{ transformOrigin: "left" }}
        />
      </div>
    </motion.div>
  );
}
