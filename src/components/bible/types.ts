/** Shared types for the Bible reader (client-safe). */

export type ReaderVerse = {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};

export type ReaderDoc = {
  translationId: string;
  translationName: string;
  licenseNote: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verses: ReaderVerse[];
  /** Verse numbers to highlight (e.g. from a reference search). */
  highlight: number[];
  /** Optional gentle note (e.g. offline treasury notice). */
  note?: string;
};

export type BibleBookMeta = {
  id: string;
  name: string;
  chapters: number;
  testament: "OT" | "NT";
};

export type TranslationMeta = {
  identifier: string;
  name: string;
  language: string;
  license?: string;
};
