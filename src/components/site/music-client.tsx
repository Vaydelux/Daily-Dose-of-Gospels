"use client";

import { useMemo, useState } from "react";
import { usePlayer } from "@/components/music/player-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Headphones, Music, Pause, Play, Plus, Upload } from "lucide-react";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function UploadDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [album, setAlbum] = useState("Singles");
  const [description, setDescription] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [scripture, setScripture] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!audioFile) {
      toast({ title: "Choose an audio file first.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const up = async (file: File) => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const d = (await res.json()) as { error?: string };
          throw new Error(d.error || "Upload failed");
        }
        return (await res.json()) as { url: string };
      };
      const audio = await up(audioFile);
      const cover = coverFile ? await up(coverFile) : "";

      const res = await fetch("/api/admin/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, album: album || "Singles", description, lyrics, scripture,
          audioUrl: audio.url, coverUrl: cover, durationSec: 0,
        }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error || "Could not save the track");
      }
      toast({ title: "Track published." });
      setOpen(false);
      setTitle(""); setDescription(""); setLyrics(""); setScripture("");
      setAudioFile(null); setCoverFile(null);
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Add track
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="space-y-3">
          <DialogHeader>
            <DialogTitle className="font-display">Publish a new song</DialogTitle>
            <DialogDescription>
              Audio (mp3/wav/ogg) and cover art go to blob storage. Everything is public to visitors.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="tr-title">Title</Label>
              <Input id="tr-title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={140} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-album">Album / playlist</Label>
              <Input id="tr-album" value={album} onChange={(e) => setAlbum(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-scripture">Scripture reference</Label>
              <Input id="tr-scripture" value={scripture} onChange={(e) => setScripture(e.target.value)} placeholder="e.g. Psalm 23:1-3" maxLength={140} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="tr-desc">Description</Label>
              <Textarea id="tr-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={1000} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="tr-lyrics">Lyrics</Label>
              <Textarea id="tr-lyrics" value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={4} maxLength={8000} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-audio">Audio file</Label>
              <Input id="tr-audio" type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/aac" onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-cover">Cover art</Label>
              <Input id="tr-cover" type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || !title.trim()}>
              {busy ? <Upload className="mr-1.5 h-4 w-4 animate-bounce" aria-hidden /> : null}
              {busy ? "Uploading…" : "Publish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MusicClient({ isAdmin }: { isAdmin: boolean }) {
  const { tracks, current, index, isPlaying, toggle, playTrackAt } = usePlayer();
  const [lyricsOpen, setLyricsOpen] = useState(false);

  const albums = useMemo(() => {
    const map = new Map<string, typeof tracks>();
    for (const t of tracks) {
      const arr = map.get(t.album) ?? [];
      arr.push(t);
      map.set(t.album, arr);
    }
    return Array.from(map.entries());
  }, [tracks]);

  const hero = current ?? tracks[0] ?? null;
  const heroIndex = current ? index : 0;
  const heroPlaying = current && isPlaying;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-40 pt-10">
      <header className="fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3" aria-hidden>
            <span className="hairline-gold w-10" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-gold-foreground dark:text-gold">
              The music room
            </p>
            <span className="hairline-gold w-10" />
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Worship Instrumentals
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Original compositions for prayer, rest, and quiet evenings — written for
            this little community. Play counts are real; your listening is anonymous.
          </p>
        </div>
        {isAdmin ? <UploadDialog /> : null}
      </header>

      {tracks.length === 0 ? (
        <Card className="mt-8 border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Music className="h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">No songs published yet.</p>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "Use “Add track” to publish the first song." : "The first compositions are on their way."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Now playing hero — foil-framed cover, ambient glow, spinning halo */}
          {hero ? (
            <section
              aria-label="Now playing"
              className="fade-up relative mt-9 overflow-hidden rounded-2xl border border-gold/25 bg-deep text-deep-foreground shadow-[0_28px_70px_-28px_rgb(15_25_44/0.6)]"
            >
              <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-[0.07]" />
              <div aria-hidden className="pointer-events-none absolute -left-28 -top-32 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-36 -right-24 h-80 w-80 rounded-full bg-[#5A6FB4]/20 blur-3xl" />
              <div aria-hidden className="hairline-gold absolute inset-x-0 top-0" />

              <div className="relative flex flex-col items-center gap-8 p-7 sm:flex-row sm:items-center sm:p-10">
                {hero.coverUrl ? (
                  <div className="relative shrink-0">
                    <div aria-hidden className="absolute -inset-4 rounded-3xl bg-gold/10 blur-2xl" />
                    {heroPlaying ? (
                      <div
                        aria-hidden
                        className="spin-slower absolute -inset-3 rounded-full border border-dashed border-gold/50"
                      />
                    ) : null}
                    <div className="relative rounded-2xl bg-gradient-to-br from-gold/80 via-gold/30 to-gold/80 p-[1.5px] shadow-[0_20px_50px_-18px_rgb(6_10_22/0.8)]">
                      <img
                        src={hero.coverUrl}
                        alt={`Cover art for ${hero.title}`}
                        className="h-44 w-44 rounded-[14px] object-cover sm:h-48 sm:w-48"
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex h-44 w-44 shrink-0 items-center justify-center rounded-2xl border border-deep-foreground/20 bg-deep-foreground/10"
                    aria-hidden
                  >
                    <Music className="h-10 w-10" />
                  </div>
                )}

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center gap-2 sm:justify-start" aria-hidden>
                    <span className="h-px w-6 bg-gold/60" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
                      {current ? (heroPlaying ? "Now playing" : "Paused") : "Featured"}
                    </p>
                    <span className="h-px w-6 bg-gold/60" />
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {hero.title}
                  </h2>
                  {hero.scripture ? (
                    <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-gold/90 sm:justify-start">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
                        <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
                      </svg>
                      {hero.scripture}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-sm text-deep-foreground/80">{hero.album}</p>
                  )}
                  {hero.description ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-deep-foreground/75">
                      {hero.description}
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <Button
                      size="lg"
                      className="bg-gold text-gold-foreground shadow-[0_10px_26px_-10px_rgb(202_156_72/0.65)] transition-[filter] hover:brightness-105"
                      onClick={() => (current ? toggle() : playTrackAt(heroIndex))}
                      aria-label={heroPlaying ? `Pause ${hero.title}` : `Play ${hero.title}`}
                    >
                      {heroPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {heroPlaying ? "Pause" : "Play"}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-deep-foreground/30 bg-transparent text-deep-foreground hover:bg-deep-foreground/10"
                      onClick={() => setLyricsOpen(true)}
                      disabled={!hero.lyrics}
                    >
                      <Headphones className="mr-2 h-4 w-4" aria-hidden /> Lyrics &amp; scripture
                    </Button>
                    <span className="text-xs tabular-nums text-deep-foreground/60">
                      {hero.playCount} play{hero.playCount === 1 ? "" : "s"}
                      {hero.durationSec ? ` · ${fmt(hero.durationSec)}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* Track lists by album — ornament headers, cover thumbs, gold accents */}
          {albums.map(([album, list]) => (
            <section key={album} aria-labelledby={`album-${album.replace(/\s+/g, "-")}`} className="mt-10">
              <div className="flex items-center gap-4">
                <span aria-hidden className="hairline-gold flex-1" />
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-gold" fill="currentColor" aria-hidden>
                  <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
                </svg>
                <h2
                  id={`album-${album.replace(/\s+/g, "-")}`}
                  className="font-display text-lg font-semibold tracking-tight text-foreground"
                >
                  {album}
                </h2>
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-gold" fill="currentColor" aria-hidden>
                  <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
                </svg>
                <span aria-hidden className="hairline-gold flex-1" />
              </div>
              <p className="mt-1 text-center text-[11px] uppercase tracking-[0.28em] text-muted-foreground" aria-hidden>
                {list.length} track{list.length === 1 ? "" : "s"}
              </p>

              <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card/60">
                <table className="w-full text-sm">
                  <caption className="sr-only">Track list for {album}</caption>
                  <thead className="bg-secondary/60 text-left text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    <tr>
                      <th className="w-10 p-3">#</th>
                      <th className="p-3">Title</th>
                      <th className="hidden sm:table-cell">Scripture</th>
                      <th className="p-3 text-right">Plays</th>
                      <th className="p-3 text-right">Length</th>
                      <th className="w-12 p-3" aria-label="Play" />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((t) => {
                      const globalIdx = tracks.findIndex((x) => x.id === t.id);
                      const isCurrent = current?.id === t.id;
                      const playingThis = isCurrent && isPlaying;
                      return (
                        <tr
                          key={t.id}
                          className={`border-t border-border/70 transition-colors ${
                            isCurrent
                              ? "bg-gold/10 shadow-[inset_3px_0_0_0_var(--gold)]"
                              : "hover:bg-secondary/40"
                          }`}
                        >
                          <td className="p-3 tabular-nums text-muted-foreground">
                            {playingThis ? (
                              <span className="flex h-4 items-end gap-[2px]" aria-hidden>
                                <span className="w-[3px] animate-pulse rounded-sm bg-gold" style={{ height: "60%" }} />
                                <span className="w-[3px] animate-pulse rounded-sm bg-gold [animation-delay:0.2s]" style={{ height: "100%" }} />
                                <span className="w-[3px] animate-pulse rounded-sm bg-gold [animation-delay:0.35s]" style={{ height: "45%" }} />
                              </span>
                            ) : (
                              globalIdx + 1
                            )}
                          </td>
                          <td className="p-3">
                            <span className="flex items-center gap-3">
                              {t.coverUrl ? (
                                <img
                                  src={t.coverUrl}
                                  alt=""
                                  aria-hidden
                                  className="h-10 w-10 shrink-0 rounded-md object-cover ring-1 ring-gold/35"
                                />
                              ) : (
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-deep text-deep-foreground" aria-hidden>
                                  <Music className="h-4 w-4" />
                                </span>
                              )}
                              <span className={`font-medium ${isCurrent ? "text-gold-foreground dark:text-gold" : ""}`}>
                                {t.title}
                              </span>
                            </span>
                          </td>
                          <td className="hidden p-3 text-muted-foreground sm:table-cell">{t.scripture || "—"}</td>
                          <td className="p-3 text-right tabular-nums text-muted-foreground">{t.playCount}</td>
                          <td className="p-3 text-right tabular-nums text-muted-foreground">
                            {t.durationSec ? fmt(t.durationSec) : "—"}
                          </td>
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => (isCurrent ? toggle() : playTrackAt(globalIdx))}
                              aria-label={playingThis ? `Pause ${t.title}` : `Play ${t.title}`}
                            >
                              {playingThis ? <Pause className="h-4 w-4 text-gold" /> : <Play className="h-4 w-4" />}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          {/* Lyrics dialog */}
          <Dialog open={lyricsOpen} onOpenChange={setLyricsOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">{hero?.title}</DialogTitle>
                {hero?.scripture ? (
                  <DialogDescription>Scripture: {hero.scripture}</DialogDescription>
                ) : null}
              </DialogHeader>
              <div className="slim-scroll max-h-[50vh] overflow-y-auto">
                <p className="whitespace-pre-line font-display text-sm leading-relaxed">
                  {hero?.lyrics || "This instrumental has no lyrics — let it simply play."}
                </p>
              </div>
              {hero?.description ? (
                <p className="border-t border-border pt-3 text-xs text-muted-foreground">{hero.description}</p>
              ) : null}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
