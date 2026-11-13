"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type PlayerTrack = {
  id: string;
  title: string;
  audioUrl: string;
  coverUrl: string;
  album: string;
  scripture: string;
  description: string;
  lyrics: string;
  playCount: number;
  durationSec: number;
};

type PlayerState = {
  tracks: PlayerTrack[];
  current: PlayerTrack | null;
  index: number;
  isPlaying: boolean;
  progress: number; // seconds
  duration: number; // seconds
  volume: number; // 0..1
  setTracks: (t: PlayerTrack[]) => void;
  playTrackAt: (index: number) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  next: () => void;
  prev: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

export function PlayerProvider({
  children,
  initialTracks = [],
}: {
  children: React.ReactNode;
  initialTracks?: PlayerTrack[];
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<PlayerTrack[]>(initialTracks);
  const [index, setIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);

  // Refs mirror the latest state so the media-event handlers (registered
  // once, below) never read a stale snapshot from their closure.
  const tracksRef = useRef(tracks);
  const indexRef = useRef(index);
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // Single <audio> element for the whole app.
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = 0.85;
    audioRef.current = audio;

    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnd = () => {
      const list = tracksRef.current;
      const next = indexRef.current + 1;
      if (next < list.length) {
        setIndex(next);
        setProgress(0);
        audio.src = list[next].audioUrl;
        void audio.play().catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
      }
    };
    const onError = () => {
      // A broken stream must never leave the player stuck in "playing".
      setIsPlaying(false);
      setDuration(0);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onError);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const playTrackAt = useCallback(
    (i: number) => {
      const audio = audioRef.current;
      if (!audio || i < 0 || i >= tracks.length) return;
      setIndex(i);
      setProgress(0);
      setDuration(tracks[i].durationSec || 0);
      audio.src = tracks[i].audioUrl;
      void audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));

      // per-track play count (fire and forget)
      void fetch(`/api/tracks/${tracks[i].id}/play`, { method: "POST" }).catch(() => {});
    },
    [tracks]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || index < 0) {
      if (tracks.length > 0) playTrackAt(0);
      return;
    }
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [index, isPlaying, playTrackAt, tracks.length]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setProgress(seconds);
  }, []);

  const setVolume = useCallback((v: number) => {
    const audio = audioRef.current;
    const clamped = Math.min(1, Math.max(0, v));
    if (audio) audio.volume = clamped;
    setVolumeState(clamped);
  }, []);

  const next = useCallback(() => {
    if (tracks.length === 0) return;
    playTrackAt((index + 1) % tracks.length);
  }, [index, playTrackAt, tracks.length]);

  const prev = useCallback(() => {
    if (tracks.length === 0) return;
    playTrackAt((index - 1 + tracks.length) % tracks.length);
  }, [index, playTrackAt, tracks.length]);

  const value = useMemo<PlayerState>(
    () => ({
      tracks,
      current: index >= 0 && index < tracks.length ? tracks[index] : null,
      index,
      isPlaying,
      progress,
      duration,
      volume,
      setTracks,
      playTrackAt,
      toggle,
      seek,
      setVolume,
      next,
      prev,
    }),
    [tracks, index, isPlaying, progress, duration, volume, playTrackAt, toggle, seek, setVolume, next, prev]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
