"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Bookmark, ChevronRight } from "lucide-react";
import { TOTAL_CHAPTERS, absoluteChapterPosition, bookTitle, getBookName } from "@/lib/bible/books-meta";

/**
 * "Continue reading" ribbon on the homepage.
 *
 * The Bible reader remembers where the visitor last rested (localStorage);
 * this ribbon picks that up and lays the ribbon bookmark across the
 * homepage — one glance, one click, and the reader opens exactly there,
 * already inked from the shelf.
 */

type LastRead = {
  b: string;
  c: number;
  t: string;
  bn?: string | null;
  at?: number | null;
};

function isPlausible(v: unknown): v is LastRead {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.b === "string" && typeof o.c === "number" && Number.isInteger(o.c) && typeof o.t === "string";
}

export function ContinueReading() {
  const [last, setLast] = useState<LastRead | null>(null);

  useEffect(() => {
    // Deferred a tick: localStorage is an external store, and reading it in
    // a callback keeps the first paint free of hydration surprises.
    const id = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem("ddog.bible.pos.v1");
        if (!raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (isPlausible(parsed)) setLast(parsed);
      } catch {
        /* no history — the ribbon simply stays away */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!last) return null;

  const bookName = last.bn || getBookName(last.b);
  const chapter = Math.max(1, last.c);
  const progress = Math.round((absoluteChapterPosition(last.b, chapter) / TOTAL_CHAPTERS) * 100);
  const when = last.at ? formatDistanceToNow(new Date(last.at), { addSuffix: true }) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="relative mb-2"
    >
      <Link
        href={`/bible?book=${encodeURIComponent(last.b)}&chapter=${chapter}&translation=${encodeURIComponent(last.t)}`}
        aria-label={`Continue reading ${bookName} chapter ${chapter} in the Bible reader`}
        className="group relative block overflow-hidden rounded-2xl bg-gradient-to-r from-[#2A3B63] via-[#22335A] to-[#1B2A4A] shadow-[0_24px_60px_-28px_rgb(15_25_44/0.65)] ring-1 ring-gold/30 transition-shadow duration-500 hover:ring-gold/60"
      >
        {/* leather sheen + gold hairline */}
        <span aria-hidden className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen bg-[radial-gradient(120%_90%_at_15%_0%,rgb(255_255_255/0.10),transparent_55%)]" />
        <span aria-hidden className="pointer-events-none absolute inset-2.5 rounded-xl border border-[#d6ab58]/25" />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-24 w-px bg-gradient-to-b from-transparent via-[#d6ab58]/30 to-transparent max-sm:hidden" />

        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-[#3D4F84] to-[#1C2947] ring-1 ring-gold/40"
            >
              <Bookmark className="h-4.5 w-4.5" style={{ width: 18, height: 18, color: "#e9c987" }} />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.34em] text-[#e9c987]">
                Continue reading
              </p>
              <p className="mt-1.5 truncate font-display text-lg font-semibold text-cream sm:text-xl">
                {bookTitle(last.b)} · Chapter {chapter}
              </p>
              <p className="mt-1 text-xs text-cream/70">
                {last.t.toUpperCase()}
                {when ? ` · ${when}` : ""}
                {` · chapter ${absoluteChapterPosition(last.b, chapter)} of ${TOTAL_CHAPTERS} in the whole Bible`}
              </p>
              {/* journey meter */}
              <div className="mt-2.5 flex max-w-xs items-center gap-2.5">
                <span aria-hidden className="h-1 flex-1 overflow-hidden rounded-full bg-white/12">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-[#F1CE83] to-[#D7A748] transition-[width] duration-1000"
                    style={{ width: `${Math.max(2, progress)}%` }}
                  />
                </span>
                <span className="font-mono text-[10px] tracking-widest text-cream/60">{progress}%</span>
              </div>
            </div>
          </div>

          <span
            aria-hidden
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-[#F1CE83] to-[#D7A748] px-5 py-2.5 text-sm font-semibold text-[#1C2947] shadow-[0_14px_34px_-12px_rgb(215_167_72/0.75)] transition-transform duration-300 group-hover:-translate-y-0.5"
          >
            Resume
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
