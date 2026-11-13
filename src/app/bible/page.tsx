import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import "./book.css";
import { BibleReader } from "@/components/bible/bible-reader";
import type { ReaderDoc } from "@/components/bible/types";
import { Reveal } from "@/components/site/reveal";
import { fetchBooks, fetchChapter, fetchTranslations } from "@/lib/bible";
import { BOOKS } from "@/lib/bible/books-meta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Read the Bible",
  description:
    "A quiet online Bible that reads like the real thing — turn gilded pages, search any reference, choose from 30+ translations, and let the Scriptures draw you near. Passage text courtesy of bible-api.com.",
  alternates: { canonical: "/bible" },
  openGraph: {
    title: "Read the Bible — Daily Dose of Gospels",
    description:
      "An online Bible with real page-turning: search any reference, browse all 66 books, and read from 30+ translations. Passage text courtesy of bible-api.com.",
    url: "/bible",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Daily Dose of Gospels" }],
  },
};

type BibleSearchParams = {
  book?: string | string[];
  chapter?: string | string[];
  translation?: string | string[];
  verse?: string | string[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BiblePage({
  searchParams,
}: {
  searchParams: Promise<BibleSearchParams>;
}) {
  const params = await searchParams;
  const hasDeepLink = Boolean(firstParam(params.book) || firstParam(params.chapter));

  // A deep link (/bible?book=PSA&chapter=23) names the opening page — the
  // reader skips its localStorage resume in that case.
  const bookId = (firstParam(params.book) ?? "JHN").trim().toUpperCase();
  const bookMeta = BOOKS.find((b) => b.id === bookId);
  const requestedChapter = Number.parseInt(firstParam(params.chapter) ?? "1", 10);
  const chapter = Number.isInteger(requestedChapter) && requestedChapter > 0
    ? Math.min(requestedChapter, bookMeta?.chapters ?? 1)
    : 1;
  const translationId = (firstParam(params.translation) ?? "kjv").trim().toLowerCase();
  const requestedVerse = Number.parseInt(firstParam(params.verse) ?? "", 10);

  // Catalogues are heavily cached (7–30 days upstream); the opening chapter
  // arrives pre-inked so the book is readable on first paint.
  const [translations, books, initial] = await Promise.all([
    fetchTranslations(),
    fetchBooks("kjv"),
    fetchChapter(bookMeta ? bookId : "JHN", chapter, translationId).catch(() => null),
  ]);

  const highlight = Number.isInteger(requestedVerse) && requestedVerse > 0 ? [requestedVerse] : [];

  const initialDoc: ReaderDoc | null = initial
    ? {
        translationId: initial.translationId,
        translationName: initial.translationName,
        licenseNote: initial.licenseNote,
        bookId: initial.bookId,
        bookName: initial.bookName,
        chapter: initial.chapter,
        verses: initial.verses,
        highlight,
      }
    : null;

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-10">
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <Reveal className="relative mb-10 text-center">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.34em] text-gold-foreground dark:text-gold">
          The Scriptures
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Read the Bible
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-[1.02rem] leading-relaxed text-muted-foreground">
          Sixty-six books, one story — bound here like the real thing. Turn the
          gilded pages, search any reference, and read from more than thirty
          translations. “Thy word is a lamp unto my feet, and a light unto my path.”
        </p>
        <div className="mx-auto mt-6 flex max-w-xs items-center gap-4" aria-hidden>
          <span className="hairline-gold flex-1" />
          <BookOpen className="h-4 w-4 text-gold" />
          <span className="hairline-gold flex-1" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          New here? Begin with{" "}
          <a
            href="#reader"
            className="font-medium text-primary underline decoration-gold/50 underline-offset-4 transition-colors hover:text-gold-foreground dark:hover:text-gold"
          >
            the Gospel of John
          </a>{" "}
          — already open below.
        </p>
      </Reveal>

      {/* ─── The reader ───────────────────────────────────────────────────── */}
      <Reveal delay={0.08}>
        <div id="reader" className="scroll-mt-24">
          <BibleReader
            initialDoc={initialDoc}
            translations={translations}
            books={books}
            allowResume={!hasDeepLink}
          />
        </div>
      </Reveal>
    </div>
  );
}
