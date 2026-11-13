"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.21, 0.47, 0.32, 0.98] as const;

/**
 * Shared reveal state: in-view via IntersectionObserver, with a 3s
 * failsafe so content can never stay hidden (print, odd embeds, fast jumps).
 */
function useRevealed(fallbackDelay = 3000) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [failsafe, setFailsafe] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFailsafe(true), fallbackDelay);
    return () => clearTimeout(t);
  }, [fallbackDelay]);
  return { ref, show: inView || failsafe };
}

/** Fade-and-rise once the element scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const { ref, show } = useRevealed();
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce ? undefined : { opacity: 0, y }}
      animate={show || reduce ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/** Parent that staggers its <StaggerItem> children into view. */
export function Stagger({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, show } = useRevealed();
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="off"
      animate={show ? "on" : "off"}
      variants={{
        off: {},
        on: { transition: { staggerChildren: 0.09, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 16,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        off: { opacity: 0, y },
        on: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * ParallaxY — children drift vertically (slower than the page) as the
 * wrapped block travels through the viewport. `amount` is in px of drift.
 */
export function ParallaxY({
  children,
  amount = 60,
  className,
}: {
  children: ReactNode;
  amount?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(scrollYProgress, [0, 1], [amount, -amount]);
  const y = useSpring(raw, { stiffness: 60, damping: 20, mass: 0.6 });

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/**
 * FloatOrnament — a decorative element that gently floats and drifts with
 * scroll parallax. Purely presentational; pass `aria-hidden` content.
 */
export function FloatOrnament({
  children,
  className,
  drift = 40,
  floatClass = "float-slow",
}: {
  children: ReactNode;
  className?: string;
  drift?: number;
  floatClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [drift, -drift]);

  return (
    <div ref={ref} aria-hidden className={cn("pointer-events-none absolute", className)}>
      <motion.div style={reduce ? undefined : { y }}>
        <div className={floatClass}>{children}</div>
      </motion.div>
    </div>
  );
}
