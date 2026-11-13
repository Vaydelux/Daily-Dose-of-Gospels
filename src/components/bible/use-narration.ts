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
 * Degrades quietly: if the browser has no speech synthesis, `supported` is
 * false and the toolbar simply hides the controls.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ReaderVerse } from "./types";

export type NarrationState = "idle" | "playing" | "paused";

export type NarrationRate = 0.8 | 1 | 1.25;

type QueueItem = { verse: number; text: string };

/* Speech support never changes within a session — a constant store. */
function subscribeSpeechSupport() {
  return () => {};
}
function getSpeechSupport(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
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
  const [state, setState] = useState<NarrationState>("idle");
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);
  const [rate, setRate] = useState<NarrationRate>(1);

  const queueRef = useRef<QueueItem[]>([]);
  const indexRef = useRef(0);
  const rateRef = useRef<NarrationRate>(1);
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

  const pickVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const lang = langRef.current.toLowerCase();
    const byLang = voices.filter((v) => v.lang.toLowerCase().startsWith(lang.split("-")[0]));
    const pool = byLang.length ? byLang : voices;
    // Prefer a non-novelty voice; the first match reads the Word plainly.
    return pool.find((v) => !v.name.toLowerCase().includes("novelty")) ?? pool[0];
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
      const u = new SpeechSynthesisUtterance(item.text);
      u.rate = rateRef.current;
      u.pitch = 1;
      u.volume = 1;
      u.lang = langRef.current;
      const voice = pickVoice();
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
  }, [pickVoice]);

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
      play,
      pause,
      resume,
      stop,
      changeRate,
    }),
    [supported, state, currentVerse, rate, play, pause, resume, stop, changeRate],
  );
}
