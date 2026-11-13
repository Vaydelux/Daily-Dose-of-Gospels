"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * RouteProgress — a thin gold "loading banner" across the top of the page.
 * Appears whenever the route changes, sweeps to ~85% while the new page
 * is prepared, then completes and dissolves. Also reacts to Suspense
 * resolution via the pathname itself.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
  const [state, setState] = useState<"hidden" | "loading" | "done">("hidden");
  const firstRun = useRef(true);

  useEffect(() => {
    // Skip the very first mount — the page is already there.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (reduce) return;

    // rAF keeps the first setState out of the synchronous effect path.
    const raf = requestAnimationFrame(() => setState("loading"));
    const t1 = setTimeout(() => setState("done"), 500);
    const t2 = setTimeout(() => setState("hidden"), 850);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname, searchParams, reduce]);

  return (
    <AnimatePresence>
      {state !== "hidden" && !reduce && (
        <div
          className="fixed inset-x-0 top-0 z-[95] h-0.5"
          role="progressbar"
          aria-label="Loading page"
        >
          <motion.div
            key={pathname + String(searchParams)}
            className="h-full bg-gold shadow-[0_0_12px_2px_color-mix(in_oklab,var(--gold)_60%,transparent)]"
            initial={state === "loading" ? { width: "0%" } : { width: "85%" }}
            animate={{ width: state === "done" ? "100%" : "85%" }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={
              state === "done"
                ? { duration: 0.25, ease: "easeOut" }
                : { duration: 0.5, ease: [0.2, 0.8, 0.4, 1] }
            }
          />
        </div>
      )}
    </AnimatePresence>
  );
}
