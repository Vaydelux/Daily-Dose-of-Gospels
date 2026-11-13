"use client";

import { usePlayer } from "@/components/music/player-provider";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MiniPlayer() {
  const { current, isPlaying, toggle, seek, progress, duration, volume, setVolume, next, prev } = usePlayer();

  if (!current) return null;

  return (
    <aside
      aria-label="Music player"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 shadow-[0_-10px_36px_-16px_rgb(18_26_43/0.22)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2">
        {current.coverUrl ? (
          <Link href="/music" aria-hidden tabIndex={-1}>
            <img
              src={current.coverUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-md object-cover ring-1 ring-gold/45"
            />
          </Link>
        ) : null}
        <Link href="/music" className="min-w-0 flex-1" aria-label={`Open music page — now playing ${current.title}`}>
          <p className="truncate text-sm font-medium">{current.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {current.album}
            {current.scripture ? ` · ${current.scripture}` : ""}
          </p>
        </Link>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={prev} aria-label="Previous track" className="hidden sm:inline-flex">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="default" size="icon" onClick={toggle} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={next} aria-label="Next track" className="hidden sm:inline-flex">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="hidden items-center gap-2 md:flex md:w-56">
          <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{fmt(progress)}</span>
          <Slider
            value={[progress]}
            max={duration || 1}
            step={1}
            onValueChange={([v]) => seek(v)}
            aria-label="Seek"
          />
          <span className="w-9 text-xs tabular-nums text-muted-foreground">{fmt(duration)}</span>
        </div>

        <div className="hidden items-center gap-1.5 lg:flex lg:w-28">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVolume(volume > 0 ? 0 : 0.85)}
            aria-label={volume > 0 ? "Mute" : "Unmute"}
          >
            {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Slider value={[volume]} max={1} step={0.05} onValueChange={([v]) => setVolume(v)} aria-label="Volume" />
        </div>
      </div>
    </aside>
  );
}
