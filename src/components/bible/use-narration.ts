"use client";

/**
 * Audio narration for the Bible reader — the Scripture, read aloud.
 *
 * Built on the Web Speech API (no keys, no uploads, no cost): each verse is
 * spoken as its own utterance so the reader can gild the verse being read
 * (via onVerse) and the queue survives long chapters. When a chapter ends,
 * onFinished fires so the reader can turn the leaf and continue into the
 * next chapter.
 *
 * Supports both curated reading voice styles (presets adjusting pitch,
 * volume, and cadence) and any system/browser SpeechSynthesisVoice.
 *
 * Degrades quietly: if the browser has no speech synthesis, `supported` is
 * false and the toolbar simply hides the controls.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ReaderVerse } from "./types";

export type NarrationState = "idle" | "playing" | "paused";

export type NarrationRate = 0.8 | 1 | 1.25;

export type NarrationVoicePresetId = "auto" | "warm" | "clear" | "devotional";

export type NarrationVoicePreset = {
  id: NarrationVoicePresetId;
  value: `preset:${NarrationVoicePresetId}`;
  label: string;
  pitch: number;
  volume: number;
  rateFactor: number;
};

export const VOICE_PRESETS: NarrationVoicePreset[] = [
  { id: "auto", value: "preset:auto", label: "Default Voice", pitch: 1, volume: 1, rateFactor: 1 },
  { id: "warm", value: "preset:warm", label: "Warm Pastor", pitch: 0.9, volume: 1, rateFactor: 0.97 },
  { id: "clear", value: "preset:clear", label: "Clear Storyteller", pitch: 1.06, volume: 1, rateFactor: 1 },
  { id: "devotional", value: "preset:devotional", label: "Quiet Devotional", pitch: 0.95, volume: 0.88, rateFactor: 0.92 },
];

const VOICE_KEY = "ddog.bible.voice.v1";
const EMPTY_VOICES: SpeechSynthesisVoice[] = [];

type QueueItem = { verse: number; text: string };

/* Speech support never changes within a session — a constant store. */
function subscribeSpeechSupport() {
  return () => {};
}
function getSpeechSupport(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/* Cached voice list snapshot so useSyncExternalStore stays referentially stable. */
let cachedVoiceKey = "";
let cachedVoices: SpeechSynthesisVoice[] = EMPTY_VOICES;

function subscribeVoices(onStoreChange: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  const synth = window.speechSynthesis;
  const handle = () => onStoreChange();
  synth.addEventListener?.("voiceschanged", handle);
  return () => synth.removeEventListener?.("voiceschanged", handle);
}

function getVoicesSnapshot(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return EMPTY_VOICES;
  const raw = window.speechSynthesis
    .getVoices()
    .filter((v) => !v.name.toLowerCase().includes("novelty"));
  const key = raw.map((v) => `${v.voiceURI}|${v.lang}`).join(";;");
  if (key !== cachedVoiceKey) {
    cachedVoiceKey = key;
    cachedVoices = raw;
  }
  return cachedVoices;
}

function getServerVoicesSnapshot(): SpeechSynthesisVoice[] {
  return EMPTY_VOICES;
}

function loadSavedVoiceId(): string {
  if (typeof window === "undefined") return "preset:auto";
  try {
    return localStorage.getItem(VOICE_KEY) || "preset:auto";
  } catch {
    return "preset:auto";
  }
}

export function useNarration(options: {
  onVerse?: (verse: number) => void;
  onFinished?: () => void;
}) {
  const { onVerse, onFinished } = options;
  // Browser capability as an external store — SSR renders "unsupported"
  // (hiding the controls), hydration upgrades it without a mismatch.
  const supported = useSyncExternalStore(
    subscribeSpeechSupport,
    getSpeechSupport,
    () => false,
  );
  const voices = useSyncExternalStore(
    subscribeVoices,
    getVoicesSnapshot,
    getServerVoicesSnapshot,
  );

  const [state, setState] = useState<NarrationState>("idle");
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);
  const [rate, setRate] = useState<NarrationRate>(1);
  const [voiceId, setVoiceId] = useState<string>(loadSavedVoiceId);

  const queueRef = useRef<QueueItem[]>([]);
  const indexRef = useRef(0);
  const rateRef = useRef<NarrationRate>(1);
  const voiceIdRef = useRef<string>(voiceId);
  const langRef = useRef<string>("en");
  const activeRef = useRef(false);
  const pausedRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const onVerseRef = useRef(onVerse);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onVerseRef.current = onVerse;
    onFinishedRef.current = onFinished;
  }, [onVerse, onFinished]);

  useEffect(() => {
    voiceIdRef.current = voiceId;
  }, [voiceId]);

  const resolveVoiceAndPreset = useCallback((): {
    voice: SpeechSynthesisVoice | null;
    preset: NarrationVoicePreset;
  } => {
    const selectedId = voiceIdRef.current;
    const available = typeof window !== "undefined" && "speechSynthesis" in window
      ? window.speechSynthesis.getVoices().filter((v) => !v.name.toLowerCase().includes("novelty"))
      : [];

    if (selectedId.startsWith("sys:")) {
      const targetUri = selectedId.slice(4);
      const exact = available.find((v) => v.voiceURI === targetUri);
      if (exact) {
        return { voice: exact, preset: VOICE_PRESETS[0] };
      }
    }

    const preset =
      VOICE_PRESETS.find((p) => p.value === selectedId) ?? VOICE_PRESETS[0];

    if (!available.length) return { voice: null, preset };

    const lang = langRef.current.toLowerCase();
    const baseLang = lang.split("-")[0];
    const byLang = available.filter((v) => v.lang.toLowerCase().startsWith(baseLang));
    const pool = byLang.length ? byLang : available;

    // Give each curated style a gentle preference among available voices.
    if (preset.id === "warm") {
      const warmMatch = pool.find((v) =>
        /\b(david|daniel|guy|andrew|brian|christopher|eric|george|ryan|arthur|natural)\b/i.test(v.name),
      );
      if (warmMatch) return { voice: warmMatch, preset };
    } else if (preset.id === "clear") {
      const clearMatch = pool.find((v) =>
        /\b(aria|jenny|samantha|ava|emma|sonia|libby|google|natural)\b/i.test(v.name),
      );
      if (clearMatch) return { voice: clearMatch, preset };
    } else if (preset.id === "devotional") {
      const softMatch = pool.find((v) =>
        /\b(serena|claire|zira|hazel|susan|jenny|natural)\b/i.test(v.name),
      );
      if (softMatch) return { voice: softMatch, preset };
    }

    return { voice: pool[0], preset };
  }, []);

  const speakNext = useCallback(() => {
    // Inner named closure so utterance handlers can chain the next verse.
    const speak = (): void => {
      if (!activeRef.current || pausedRef.current) return;
      const queue = queueRef.current;
      const i = indexRef.current;
      if (i >= queue.length) {
        activeRef.current = false;
        setCurrentVerse(null);
        setState("idle");
        onFinishedRef.current?.();
        return;
      }
      const item = queue[i];
      const { voice, preset } = resolveVoiceAndPreset();
      const u = new SpeechSynthesisUtterance(item.text);
      u.rate = Math.max(0.5, Math.min(2, rateRef.current * preset.rateFactor));
      u.pitch = preset.pitch;
      u.volume = preset.volume;
      u.lang = voice?.lang || langRef.current;
      if (voice) u.voice = voice;
      u.onstart = () => {
        if (!activeRef.current || pausedRef.current) return;
        consecutiveErrorsRef.current = 0;
        setCurrentVerse(item.verse);
        onVerseRef.current?.(item.verse);
      };
      u.onend = () => {
        if (!activeRef.current || pausedRef.current) return;
        consecutiveErrorsRef.current = 0;
        indexRef.current = i + 1;
        speak();
      };
      u.onerror = () => {
        // A failed utterance (network voice glitch, tab suspension) skips the
        // verse rather than stalling the reading — but if synthesis keeps
        // failing (no voices installed, blocked audio), halt instead of
        // crawling the whole canon verse by verse.
        if (!activeRef.current || pausedRef.current) return;
        consecutiveErrorsRef.current += 1;
        if (consecutiveErrorsRef.current >= 3) {
          activeRef.current = false;
          queueRef.current = [];
          indexRef.current = 0;
          setCurrentVerse(null);
          setState("idle");
          try {
            window.speechSynthesis.cancel();
          } catch {
            /* engine already gone */
          }
          return;
        }
        indexRef.current = i + 1;
        speak();
      };
      window.speechSynthesis.speak(u);
    };
    speak();
  }, [resolveVoiceAndPreset]);

  const stop = useCallback(() => {
    activeRef.current = false;
    pausedRef.current = false;
    queueRef.current = [];
    indexRef.current = 0;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentVerse(null);
    setState("idle");
  }, []);

  const play = useCallback(
    (verses: ReaderVerse[], lang?: string, fromVerse?: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const usable = verses.filter((v) => v.text.trim().length > 0);
      if (!usable.length) return;
      window.speechSynthesis.cancel();
      const startIdx = fromVerse ? Math.max(0, usable.findIndex((v) => v.verse === fromVerse)) : 0;
      queueRef.current = usable
        .slice(startIdx)
        .map((v) => ({ verse: v.verse, text: v.text.replace(/\s+/g, " ").trim() }));
      indexRef.current = 0;
      langRef.current = lang && lang.trim() ? lang.trim() : "en";
      activeRef.current = true;
      pausedRef.current = false;
      setState("playing");
      // Give cancel() a tick to flush before the first utterance (Chrome).
      window.setTimeout(() => {
        if (activeRef.current && !pausedRef.current) speakNext();
      }, 60);
    },
    [speakNext],
  );

  const pause = useCallback(() => {
    if (!activeRef.current || state !== "playing") return;
    pausedRef.current = true;
    window.speechSynthesis.pause();
    setState("paused");
  }, [state]);

  const resume = useCallback(() => {
    if (!activeRef.current || state !== "paused") return;
    pausedRef.current = false;
    window.speechSynthesis.resume();
    setState("playing");
    // Some engines never resume an utterance paused mid-flight; re-speak
    // the current verse if the queue stalls.
    window.setTimeout(() => {
      if (activeRef.current && !pausedRef.current && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        speakNext();
      }
    }, 350);
  }, [state, speakNext]);

  /** Change pace mid-reading: restarts the current verse at the new rate. */
  const changeRate = useCallback(
    (next: NarrationRate) => {
      rateRef.current = next;
      setRate(next);
      if (activeRef.current && state === "playing" && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.setTimeout(() => {
          if (activeRef.current && !pausedRef.current) speakNext();
        }, 60);
      }
    },
    [state, speakNext],
  );

  /** Change reading voice or style mid-reading and persist selection. */
  const changeVoice = useCallback(
    (nextVoiceId: string) => {
      voiceIdRef.current = nextVoiceId;
      setVoiceId(nextVoiceId);
      try {
        localStorage.setItem(VOICE_KEY, nextVoiceId);
      } catch {
        /* ignore storage quota errors */
      }
      if (activeRef.current && state === "playing" && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.setTimeout(() => {
          if (activeRef.current && !pausedRef.current) speakNext();
        }, 60);
      }
    },
    [state, speakNext],
  );

  // Unmount + page-hide hygiene.
  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && activeRef.current) {
        // Engines throttle timers in background tabs; pause politely.
        pause();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [pause]);

  return useMemo(
    () => ({
      supported,
      state,
      currentVerse,
      rate,
      voiceId,
      voices,
      play,
      pause,
      resume,
      stop,
      changeRate,
      changeVoice,
    }),
    [supported, state, currentVerse, rate, voiceId, voices, play, pause, resume, stop, changeRate, changeVoice],
  );
}
