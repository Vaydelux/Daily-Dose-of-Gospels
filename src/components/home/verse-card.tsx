import { CloudSun } from "lucide-react";

export type VerseData = {
  verseText: string;
  verseRef: string;
  reflection: string;
};

export function VerseCard({ verse }: { verse: VerseData }) {
  return (
    <article className="verse-card lift flex h-full flex-col" aria-labelledby="verse-of-the-day">
      <div className="flex items-center gap-2 text-gold">
        <CloudSun className="h-4 w-4" aria-hidden />
        <h2 id="verse-of-the-day" className="text-xs font-semibold uppercase tracking-widest">
          Verse of the Day
        </h2>
      </div>
      <blockquote className="mt-4 flex-1">
        <p className="font-display text-xl leading-relaxed sm:text-2xl">“{verse.verseText}”</p>
        <footer className="mt-3 text-sm font-medium text-gold-foreground dark:text-gold">— {verse.verseRef}</footer>
      </blockquote>
      <div className="mt-4 border-t border-border/70 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          A short reflection — our words, not His
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{verse.reflection}</p>
      </div>
    </article>
  );
}
