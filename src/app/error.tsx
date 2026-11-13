"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";

/**
 * Route-level error boundary — a soft landing when a section fails,
 * with a way back and a word of mercy. (Lamentations 3:22–23, KJV)
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the failure in the console for debugging, quietly for the user.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 pb-24 pt-14 text-center">
      <Reveal>
        <span aria-hidden className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-card shadow-[0_10px_30px_-12px_rgb(202_156_72/0.5)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-gold" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 4v16M7.5 9h9" />
          </svg>
        </span>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Something faltered here.
        </h1>
        <p className="mt-3 font-display text-[1.05rem] italic leading-relaxed text-muted-foreground">
          “It is of the LORD’s mercies that we are not consumed, because his
          compassions fail not. They are new every morning: great is thy faithfulness.”
        </p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
          Lamentations 3:22–23
        </p>
        <p className="mt-5 text-[0.95rem] leading-relaxed text-muted-foreground">
          The stumble is ours, not yours. Try again — mercies are new every morning,
          and often they are new every refresh.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            onClick={reset}
            className="rounded-full bg-gradient-to-b from-[#F1CE83] via-[#D7A748] to-[#C08E2F] px-7 text-sm font-semibold text-[#2A1E07] shadow-[0_14px_34px_-12px_rgb(202_156_72/0.65)] transition-all hover:-translate-y-0.5 hover:bg-none hover:from-[#EBBE63] hover:to-[#C08E2F]"
          >
            Try again
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-border px-7 text-sm font-medium hover:border-gold/60"
          >
            <Link href="/">Go home</Link>
          </Button>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-muted-foreground/70">Reference: {error.digest}</p>
        )}
      </Reveal>
    </div>
  );
}
