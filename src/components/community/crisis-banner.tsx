"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function CrisisBanner({
  title,
  body,
  verse,
  verseRef,
  className,
}: {
  title: string;
  body: string;
  verse?: string;
  verseRef?: string;
  className?: string;
}) {
  return (
    <aside
      role="alert"
      className={cn("rounded-xl border-2 border-gold/60 bg-accent/80 p-5", className)}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-foreground" aria-hidden />
        <div>
          <p className="font-display text-lg font-semibold">{title}</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{body}</p>
          {verse ? (
            <p className="mt-3 border-l-2 border-gold pl-3 text-sm italic text-muted-foreground">
              “{verse}” — {verseRef}
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
