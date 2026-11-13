import { BookOpen, ExternalLink } from "lucide-react";
import { bibleGatewayUrl } from "@/lib/parables-bank";

export type ParableData = {
  parableTitle: string;
  parableRef: string;
  parableBody: string;
  parableTake: string;
  parableTakeRef: string;
  parableNote: string;
  translation: string;
};

/**
 * Parable of the Day — a REAL parable from the Bible, verbatim.
 * Nothing on this card is invented: the text, the key verse and the reference
 * come straight from Scripture; the title is the church's traditional name and
 * the note is one sentence of factual context.
 */
export function ParableCard({ parable }: { parable: ParableData }) {
  return (
    <article className="verse-card lift flex h-full flex-col" aria-labelledby="parable-of-the-day">
      <div className="flex flex-wrap items-center justify-between gap-2 text-gold">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" aria-hidden />
          <h2 id="parable-of-the-day" className="text-xs font-semibold uppercase tracking-widest">
            Parable of the Day
          </h2>
        </div>
        <span className="rounded-full bg-accent/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
          Straight from the Bible
        </span>
      </div>

      <h3 className="mt-4 font-display text-2xl leading-snug">{parable.parableTitle}</h3>
      <a
        href={bibleGatewayUrl(parable.parableRef)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-gold-foreground hover:underline dark:text-gold"
      >
        {parable.parableRef}
        <ExternalLink className="h-3 w-3" aria-hidden />
        <span className="sr-only">(opens BibleGateway in a new tab)</span>
      </a>
      <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground">{parable.parableNote}</p>

      <div className="slim-scroll mt-3 max-h-72 flex-1 overflow-y-auto rounded-lg bg-muted/40 p-4 text-[15px] leading-relaxed text-muted-foreground">
        {parable.parableBody}
      </div>

      <blockquote className="mt-4 rounded-lg bg-accent/70 px-4 py-3">
        <p className="text-sm font-medium leading-relaxed text-accent-foreground">{parable.parableTake}</p>
        <footer className="mt-1 text-xs font-semibold text-gold-foreground dark:text-gold">
          — {parable.parableTakeRef}
        </footer>
      </blockquote>

      <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground/70">
        {parable.translation}
      </p>
    </article>
  );
}
