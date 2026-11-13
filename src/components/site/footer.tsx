import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="relative mt-auto">
      <div className="hairline-gold" aria-hidden />
      <div className="bg-secondary/50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-gold">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
                  </svg>
                </span>
                <p className="font-display text-lg font-semibold tracking-tight">Daily Dose of Gospels</p>
              </div>
              <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
                A quiet corner of the internet — fully anonymous, Christ-centered, and hopeful.
                AI-assisted encouragement is not a substitute for professional counseling.
              </p>
            </div>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-[0.92rem] text-muted-foreground">
              <Link href="/community" className="transition-colors hover:text-gold-foreground dark:hover:text-gold">Community</Link>
              <Link href="/counsel" className="transition-colors hover:text-gold-foreground dark:hover:text-gold">Counselor</Link>
              <Link href="/verses" className="transition-colors hover:text-gold-foreground dark:hover:text-gold">Verses</Link>
              <Link href="/music" className="transition-colors hover:text-gold-foreground dark:hover:text-gold">Music</Link>
              <Link href="/faith" className="font-medium text-foreground transition-colors hover:text-gold-foreground dark:hover:text-gold">Faith</Link>
              <Link href="/privacy" className="transition-colors hover:text-gold-foreground dark:hover:text-gold">Privacy</Link>
              <Link href="/terms" className="transition-colors hover:text-gold-foreground dark:hover:text-gold">Terms</Link>
            </nav>
          </div>
          <p className="mt-8 flex items-center justify-start gap-2 border-t border-border/50 pt-5 text-[0.92rem] font-medium text-foreground sm:justify-center">
            <span aria-hidden className="text-gold">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
              </svg>
            </span>
            Jesus Christ is Lord and Savior — this site exists to make Him known.
          </p>
          <p className="mt-3 font-display text-[0.95rem] italic leading-relaxed text-muted-foreground sm:text-center">
            <span aria-hidden className="mr-1 text-gold">“</span>
            Come to me, all you who are weary and burdened, and I will give you rest.
            <span aria-hidden className="ml-1 text-gold">”</span>
            <span className="ml-2 text-xs font-semibold not-italic uppercase tracking-[0.22em] text-gold/80">Matthew 11:28</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
