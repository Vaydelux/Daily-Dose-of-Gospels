"use client";

import { useSyncExternalStore } from "react";

/**
 * Device-local verse favorites (localStorage, no account), shared by /verses
 * and the counselor's scripture cards. Implemented as a tiny external store so
 * React subscribes properly (no setState-in-effect cascades).
 */

const FAV_KEY = "ddog_favorites_v1";

let snapshot: string[] = [];
let initialized = false;
const listeners = new Set<() => void>();

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function ensureInit() {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    snapshot = readStorage();
    window.addEventListener("storage", () => {
      snapshot = readStorage();
      listeners.forEach((l) => l());
    });
  }
}

function subscribe(listener: () => void): () => void {
  ensureInit();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): string[] {
  ensureInit();
  return snapshot;
}

const EMPTY_SNAPSHOT: string[] = [];

function getServerSnapshot(): string[] {
  return EMPTY_SNAPSHOT;
}

function emit(next: string[]) {
  snapshot = next;
  listeners.forEach((l) => l());
}

export function useFavorites(): [string[], (ref: string) => void] {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleFavorite(ref: string) {
    const current = getSnapshot();
    const next = current.includes(ref) ? current.filter((r) => r !== ref) : [...current, ref];
    try {
      window.localStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable (private mode) — still update the in-memory view
    }
    emit(next);
  }

  return [favorites, toggleFavorite];
}

export function saveFavorite(ref: string) {
  const current = getSnapshot();
  if (!current.includes(ref)) {
    const next = [...current, ref];
    try {
      window.localStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    emit(next);
  }
}
