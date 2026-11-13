import { cn } from "@/lib/utils";

/**
 * Skeleton library — shimmering, gold-tinted placeholders that mirror the
 * real layout shapes (never plain gray boxes). Pure CSS, server-component
 * safe, and honored by prefers-reduced-motion.
 */

export function SLine({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={cn("shimmer rounded-full", className)} style={style} />;
}

export function SCircle({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-full", className)} />;
}

/** The little banner shown above every loading screen. */
export function LoadingBanner({
  label = "Preparing today's light",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-fit items-center gap-3 rounded-full border border-border bg-card/80 px-5 py-2.5 shadow-sm backdrop-blur",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
      </span>
      <span className="text-sm font-medium tracking-wide text-muted-foreground">
        {label}
        <span className="typing-dot ml-1" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </span>
    </div>
  );
}

/* ─── Composed skeletons ──────────────────────────────────────────────────── */

export function VerseCardSkeleton() {
  return (
    <div className="verse-card flex h-full flex-col" aria-hidden>
      <div className="flex items-center gap-2">
        <SCircle className="h-4 w-4" />
        <SLine className="h-3 w-28" />
      </div>
      <div className="mt-5 space-y-3">
        <SLine className="h-5 w-11/12" />
        <SLine className="h-5 w-full" />
        <SLine className="h-5 w-7/12" />
      </div>
      <SLine className="mt-4 h-3.5 w-24" />
      <div className="mt-5 space-y-2.5 border-t border-border/70 pt-4">
        <SLine className="h-3 w-36" />
        <SLine className="h-3 w-full" />
        <SLine className="h-3 w-9/12" />
      </div>
    </div>
  );
}

export function ParableCardSkeleton() {
  return (
    <div className="verse-card flex h-full flex-col" aria-hidden>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SCircle className="h-4 w-4" />
          <SLine className="h-3 w-32" />
        </div>
        <SLine className="h-6 w-36 rounded-full" />
      </div>
      <SLine className="mt-5 h-7 w-2/3" />
      <SLine className="mt-2.5 h-3.5 w-28" />
      <div className="mt-4 flex-1 space-y-3 rounded-lg bg-muted/40 p-4">
        <SLine className="h-3 w-full" />
        <SLine className="h-3 w-11/12" />
        <SLine className="h-3 w-full" />
        <SLine className="h-3 w-4/5" />
        <SLine className="h-3 w-10/12" />
      </div>
      <div className="mt-4 space-y-2 rounded-lg bg-accent/70 px-4 py-3">
        <SLine className="h-3 w-full" />
        <SLine className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm" aria-hidden>
      <div className="flex items-center justify-between">
        <SLine className="h-5 w-24 rounded-full" />
        <SLine className="h-3 w-12" />
      </div>
      <SLine className="mt-3.5 h-4.5 w-3/4" />
      <div className="mt-3 space-y-2.5">
        <SLine className="h-3 w-full" />
        <SLine className="h-3 w-11/12" />
        <SLine className="h-3 w-2/3" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <SLine className="h-3.5 w-10" />
        <SLine className="h-3.5 w-14" />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className="bubble-ai w-2/3">
        <div className="space-y-2">
          <SLine className="h-3 w-full" />
          <SLine className="h-3 w-4/5" />
        </div>
      </div>
      <div className="bubble-user w-1/2">
        <SLine className="h-3 w-3/4 opacity-40" />
      </div>
      <div className="bubble-ai w-3/4">
        <div className="space-y-2">
          <SLine className="h-3 w-full" />
          <SLine className="h-3 w-11/12" />
          <SLine className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg px-3 py-2.5" aria-hidden>
      <div className="shimmer h-12 w-12 rounded-md" />
      <div className="flex-1 space-y-2">
        <SLine className="h-3.5 w-1/3" />
        <SLine className="h-3 w-1/4" />
      </div>
      <div className="flex items-end gap-[3px]">
        {[10, 16, 8, 14, 9].map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-gold/40"
            style={{ height: h, animation: `ddog-bounce 1.4s ease-in-out ${i * 0.12}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10" aria-hidden>
      <SLine className="h-4 w-40" />
      <SLine className="mt-3 h-9 w-80 max-w-full" />
      <SLine className="mt-3 h-4 w-full max-w-xl" />
    </div>
  );
}

/* ─── Full-route loading screens ──────────────────────────────────────────── */

export function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10" aria-busy="true">
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-deep px-6 py-16 text-center sm:py-24"
        aria-hidden
      >
        <div className="bg-grid mask-radial-fade absolute inset-0 opacity-60" />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
          <SLine className="h-3 w-56" />
          <SLine className="h-12 w-4/5" />
          <SLine className="h-4 w-full" />
          <SLine className="h-4 w-3/4" />
          <div className="mt-4 flex gap-3">
            <SLine className="h-10 w-44 rounded-lg" />
            <SLine className="h-10 w-44 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <VerseCardSkeleton />
        <ParableCardSkeleton />
      </div>
      <div className="mt-10 flex justify-center">
        <LoadingBanner label="Gathering today's manna" />
      </div>
    </div>
  );
}

export function CommunitySkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-10" aria-busy="true">
      <HeaderSkeleton />
      <div className="mt-8 flex justify-center">
        <LoadingBanner label="Opening the courtyard" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  );
}

export function CounselSkeleton() {
  return (
    <div className="mx-auto flex h-[calc(100vh-14rem)] max-w-3xl flex-col px-4 pb-24 pt-10" aria-busy="true">
      <div aria-hidden>
        <div className="flex items-center gap-3">
          <SCircle className="h-10 w-10" />
          <div className="space-y-2">
            <SLine className="h-4 w-44" />
            <SLine className="h-3 w-64 max-w-full" />
          </div>
        </div>
        <div className="mt-8 flex flex-1 flex-col justify-end">
          <ChatSkeleton />
        </div>
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
          <SLine className="h-9 w-full" />
          <SCircle className="h-9 w-9" />
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <LoadingBanner label="Lighting the candle" />
      </div>
    </div>
  );
}

export function MusicSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10" aria-busy="true">
      <HeaderSkeleton />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="verse-card lg:col-span-2" aria-hidden>
          <SLine className="h-5 w-40" />
          <div className="mt-5 flex items-center gap-5">
            <div className="shimmer h-36 w-36 rounded-xl" />
            <div className="flex-1 space-y-3">
              <SLine className="h-6 w-2/3" />
              <SLine className="h-4 w-1/3" />
              <SLine className="h-9 w-40 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="verse-card" aria-hidden>
          <SLine className="h-5 w-32" />
          <div className="mt-4 space-y-1">
            <TrackRowSkeleton />
            <TrackRowSkeleton />
            <TrackRowSkeleton />
          </div>
        </div>
      </div>
      <div className="mt-10 flex justify-center">
        <LoadingBanner label="Tuning the strings" />
      </div>
    </div>
  );
}

export function VersesSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10" aria-busy="true">
      <HeaderSkeleton />
      <div className="mt-8 flex flex-wrap gap-2" aria-hidden>
        {[92, 76, 110, 84, 70, 96, 88, 104].map((w, i) => (
          <SLine key={i} className="h-9 rounded-full" style={{ width: w }} />
        ))}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="verse-card">
            <SLine className="h-3 w-24" />
            <div className="mt-4 space-y-2.5">
              <SLine className="h-4 w-full" />
              <SLine className="h-4 w-10/12" />
              <SLine className="h-4 w-6/12" />
            </div>
            <SLine className="mt-4 h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10" aria-busy="true">
      <HeaderSkeleton />
      <div className="verse-card mt-8" aria-hidden>
        <div className="flex items-center justify-between">
          <SLine className="h-5 w-24 rounded-full" />
          <SLine className="h-3 w-16" />
        </div>
        <SLine className="mt-4 h-6 w-3/4" />
        <div className="mt-4 space-y-2.5">
          <SLine className="h-3.5 w-full" />
          <SLine className="h-3.5 w-11/12" />
          <SLine className="h-3.5 w-4/5" />
          <SLine className="h-3.5 w-1/2" />
        </div>
        <div className="mt-5 flex gap-3">
          <SLine className="h-9 w-36 rounded-lg" />
          <SLine className="h-9 w-32 rounded-lg" />
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <LoadingBanner label="Fetching the conversation" />
      </div>
    </div>
  );
}
