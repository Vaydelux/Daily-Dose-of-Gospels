"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import openScripture from "@/images/open-scripture.png";

/**
 * "Read the Word" — a wide, quiet banner inviting the visitor into the
 * page-turning Bible reader at /bible.
 */
export function ReadTheWordBand() {
  return (
    <Link
      href="/bible"
      aria-label="Read the Bible — open the page-turning reader"
      className="img-frame lift group relative block overflow-hidden rounded-2xl"
    >
      <Image
        src={openScripture}
        alt="An open Bible on a wooden table, light falling across the pages"
        className="h-[300px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] sm:h-[340px]"
        placeholder="blur"
        sizes="(max-width: 1024px) 100vw, 1152px"
      />
      <div className="overlay-deep absolute inset-0" aria-hidden />

      {/* Gold hairline inner ring */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-xl border border-gold/25 sm:inset-4"
      />

      <div className="absolute inset-0 flex flex-col items-start justify-end p-6 sm:p-10">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.34em] text-gold">
          Read the Word
        </p>
        <h2 className="text-shadow-luxe mt-3 max-w-xl font-display text-3xl font-semibold text-cream sm:text-4xl">
          Open the Bible — it turns like the real thing.
        </h2>
        <p className="text-shadow-luxe mt-3 max-w-lg text-[0.95rem] leading-relaxed text-cream/85">
          Gilded pages, a ribbon bookmark, and every reference within reach —
          sixty-six books in more than thirty translations, free for anyone, no
          account needed.
        </p>
        <span className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#F1CE83] to-[#D7A748] px-5 py-2.5 text-sm font-semibold text-[#1C2947] shadow-[0_14px_34px_-12px_rgb(215_167_72/0.75)] transition-transform duration-300 group-hover:-translate-y-0.5">
          <BookOpen className="h-4 w-4" aria-hidden />
          Open the reader
        </span>
      </div>
    </Link>
  );
}
