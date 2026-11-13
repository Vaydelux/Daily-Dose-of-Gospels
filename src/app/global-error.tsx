"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Global error boundary — catches failures in the root layout itself.
 * It renders its own <html>/<body>, so it carries the design tokens
 * but no header/footer/player.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-card shadow-[0_10px_30px_-12px_rgb(202_156_72/0.5)]">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-gold" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 4v16M7.5 9h9" />
            </svg>
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Be still — something faltered.
          </h1>
          <p className="mt-3 max-w-md font-display text-[1.05rem] italic leading-relaxed text-muted-foreground">
            “Be still, and know that I am God.”
          </p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            Psalm 46:10
          </p>
          <button
            onClick={reset}
            className="mt-8 inline-flex items-center rounded-full bg-gradient-to-b from-[#F1CE83] via-[#D7A748] to-[#C08E2F] px-7 py-3 text-sm font-semibold text-[#2A1E07] shadow-[0_14px_34px_-12px_rgb(202_156_72/0.65)] transition-all hover:-translate-y-0.5"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
