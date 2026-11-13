"use client";

import { useEffect } from "react";

/** localStorage flag read by the Bible reader (and any future heavy surface). */
export const PERF_LITE_KEY = "ddog.perf.lite.v1";
/** Fired live when the probe convicts the device mid-session. */
export const PERF_LITE_EVENT = "ddog:perf-lite";

const PROBE_SESSION_KEY = "ddog.perf.probe.v1";
const SAMPLE_MS = 2000;
const START_DELAY_MS = 1200;
const FPS_FLOOR = 40;

/**
 * PerfProbe — a tiny first-visit frame-rate probe.
 *
 * Runs once per session, well after first paint, and quietly samples
 * requestAnimationFrame for ~2s. If the display pipeline cannot hold a
 * comfortable cadence (≲ 40fps), the session drops to "lite" without a
 * reload: ambient theatre freezes (CSS `html[data-perf="lite"]`) and the
 * Bible reader swaps its gilded 3D page-turn for quiet fades.
 *
 * The visitor keeps the final word — a manual graphics pick in the reader
 * always overrides the probe.
 */
export function PerfProbe() {
  useEffect(() => {
    // One honest measurement per session is enough; never burn cycles re-testing.
    try {
      if (sessionStorage.getItem(PROBE_SESSION_KEY)) return;
      sessionStorage.setItem(PROBE_SESSION_KEY, "1");
    } catch {
      return; // storage blocked — assume capable, skip probing entirely
    }

    let cancelled = false;
    let raf = 0;
    let kickoffTimer = 0;
    let hidden = false;
    let frames = 0;

    // A backgrounded tab would fake a stall (rAF freezes when hidden).
    const onVisibility = () => {
      if (document.hidden) hidden = true;
    };
    document.addEventListener("visibilitychange", onVisibility);

    const finish = (start: number, now: number) => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (cancelled || hidden) return;
      const elapsed = (now - start) / 1000;
      if (elapsed <= 0 || frames / elapsed >= FPS_FLOOR) return;
      try {
        localStorage.setItem(PERF_LITE_KEY, "1");
      } catch {
        /* private mode — the flag is best-effort */
      }
      document.documentElement.dataset.perf = "lite";
      window.dispatchEvent(new CustomEvent(PERF_LITE_EVENT));
    };

    const measure = () => {
      if (cancelled) return;
      if (document.hidden) {
        document.removeEventListener("visibilitychange", onVisibility);
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        frames += 1;
        if (now - start < SAMPLE_MS && !hidden) {
          raf = requestAnimationFrame(tick);
        } else {
          finish(start, now);
        }
      };
      raf = requestAnimationFrame(tick);
    };

    // Start after load settles (fonts, hero art, hydration) so the probe
    // measures the steady-state experience, not first-load jank.
    const kickoff = () => {
      kickoffTimer = window.setTimeout(measure, START_DELAY_MS);
    };
    if (document.readyState === "complete") kickoff();
    else window.addEventListener("load", kickoff, { once: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(kickoffTimer);
      window.removeEventListener("load", kickoff);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
