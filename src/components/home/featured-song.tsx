"use client";

import { usePlayer } from "@/components/music/player-provider";
import { Button } from "@/components/ui/button";
import { Play, Pause, Music } from "lucide-react";

export type FeaturedTrack = {
  id: string;
  title: string;
  album: string;
  scripture: string;
  coverUrl: string;
};

export function FeaturedSong({ track }: { track: FeaturedTrack | null }) {
  const { playTrackAt, tracks, current, isPlaying, toggle } = usePlayer();
  const inPlayer = current?.id === track?.id;

  if (!track) {
    return (
      <section aria-labelledby="featured-song" className="verse-card lift">
        <div className="flex items-center gap-2 text-gold">
          <Music className="h-4 w-4" aria-hidden />
          <h2 id="featured-song" className="text-xs font-semibold uppercase tracking-widest">Featured song</h2>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">No songs have been published yet — check back soon.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="featured-song" className="verse-card lift">
      <div className="flex items-center gap-2 text-gold">
        <Music className="h-4 w-4" aria-hidden />
        <h2 id="featured-song" className="text-xs font-semibold uppercase tracking-widest">Featured song</h2>
      </div>
      <div className="mt-4 flex items-center gap-4">
        {track.coverUrl ? (
          <div className="relative shrink-0">
            <div aria-hidden className="absolute -inset-1.5 rounded-xl bg-gold/15 blur-md" />
            <div className="relative rounded-lg bg-gradient-to-br from-gold/70 via-gold/25 to-gold/70 p-[1.5px] shadow-md">
              <img
                src={track.coverUrl}
                alt={`Cover art for ${track.title}`}
                className="h-16 w-16 rounded-[6px] object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-deep text-deep-foreground" aria-hidden>
            <Music className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-semibold">{track.title}</p>
          <p className="truncate text-sm text-muted-foreground">
            {track.album}
            {track.scripture ? ` · ${track.scripture}` : ""}
          </p>
        </div>
        <Button
          size="icon"
          aria-label={inPlayer && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          onClick={() => {
            if (inPlayer) {
              toggle();
            } else {
              const idx = tracks.findIndex((t) => t.id === track.id);
              if (idx >= 0) playTrackAt(idx);
            }
          }}
        >
          {inPlayer && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
      <a href="/music" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
        Listen in the music room →
      </a>
    </section>
  );
}
