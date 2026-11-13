"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HeartHandshake, MessagesSquare, Music } from "lucide-react";

const EASE_OUT = [0.21, 0.47, 0.32, 0.98] as const;
const TITLE_WORDS = ["Daily", "Dose", "of", "Gospels"];

/**
 * Hero — the cinematic front door.
 * Layers (back → front):
 *   1. cathedral grid + fine grid      (static, masked)
 *   2. aurora glow                     (parallax, slow)
 *   3. floating ornaments ✦ ☩ ◦        (parallax at different depths)
 *   4. title, verse line, CTAs         (staggered entrance)
 * A quiet scroll cue finishes the composition.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Depth layers: farther things move less.
  const glowY = useTransform(scrollYProgress, [0, 1], ["0%", "38%"]);
  const ornamentFarY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const ornamentNearY = useTransform(scrollYProgress, [0, 1], [0, 170]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const veil = useTransform(scrollYProgress, [0, 1], [0, 0.35]);

  const rise = (delay: number) => ({
    initial: reduce ? undefined : ({ opacity: 0, y: 24 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: EASE_OUT },
  });

  return (
    <section
      ref={ref}
      aria-label="Welcome"
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-deep text-deep-foreground shadow-luxe ring-1 ring-gold/15"
    >
      {/* 1 — grids */}
      <div aria-hidden className="bg-grid mask-radial-fade absolute inset-0 opacity-70" />
      <div aria-hidden className="bg-grid-lg mask-fade-b absolute inset-0 opacity-40" />

      {/* 2 — aurora glow, drifting slower than the page */}
      <motion.div aria-hidden style={reduce ? undefined : { y: glowY }} className="absolute inset-0">
        <div
          className="aurora absolute left-1/2 top-[-12rem] h-[30rem] w-[46rem] max-w-none -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--gold) 38%, transparent), transparent)",
          }}
        />
        <div
          className="aurora-slow absolute bottom-[-14rem] right-[-8rem] h-[24rem] w-[30rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--gold) 18%, transparent), transparent)",
          }}
        />
      </motion.div>

      {/* 3 — floating ornaments, two parallax depths */}
      <motion.div aria-hidden style={reduce ? undefined : { y: ornamentFarY }} className="absolute inset-0">
        <div className="float-slower absolute left-[7%] top-[18%] hidden sm:block">
          <span className="block h-10 w-10 rounded-full border border-dashed border-gold/30" />
        </div>
        <div className="float-slow absolute bottom-[16%] left-[16%] hidden md:block">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-gold/35" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3v18M7 9h10" strokeLinecap="round" />
          </svg>
        </div>
        <div className="float-slow absolute right-[9%] top-[24%] hidden sm:block">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold/40" fill="currentColor">
            <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
          </svg>
        </div>
      </motion.div>
      <motion.div aria-hidden style={reduce ? undefined : { y: ornamentNearY }} className="absolute inset-0">
        <div className="float-slow absolute bottom-[24%] right-[18%] hidden lg:block">
          <span className="block h-16 w-16 rounded-full border border-gold/20" />
        </div>
        <div className="float-slower absolute left-[26%] top-[12%] hidden lg:block">
          <svg viewBox="0 0 24 24" className="h-3 w-3 text-gold/50" fill="currentColor">
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      </motion.div>

      {/* 4 — content */}
      <motion.div
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
        className="relative px-6 py-16 text-center sm:px-10 sm:py-24"
      >
        {/* spinning scripture ring + cross */}
        <motion.div
          className="relative mx-auto flex h-16 w-16 items-center justify-center"
          {...rise(0.05)}
        >
          <span aria-hidden className="spin-slower absolute inset-0 rounded-full border border-dashed border-gold/40" />
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 text-gold"
            style={{ filter: "drop-shadow(0 0 10px color-mix(in oklab, var(--gold) 60%, transparent))" }}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
          >
            <path d="M12 3v18M7 9h10" strokeLinecap="round" />
          </svg>
        </motion.div>

        <motion.p
          className="relative mt-6 text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-gold"
          {...rise(0.15)}
        >
          Fully anonymous · Christ-centered
        </motion.p>

        <h1 className="relative mx-auto mt-4 max-w-3xl font-display text-[2.6rem] font-semibold leading-[1.08] sm:text-6xl sm:leading-[1.06]">
          {TITLE_WORDS.map((word, i) => (
            <span key={word} className="inline-block overflow-hidden pb-1.5 align-bottom">
              <motion.span
                className="text-gradient-gold inline-block"
                initial={reduce ? undefined : { y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.75, delay: 0.28 + i * 0.1, ease: EASE_OUT }}
              >
                {word}
                {i < TITLE_WORDS.length - 1 ? "\u00A0" : ""}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          className="relative mx-auto mt-6 max-w-2xl text-[1.05rem] leading-[1.75] text-deep-foreground/85 sm:text-lg sm:leading-[1.75]"
          {...rise(0.65)}
        >
          A quiet place to carry your questions, your grief, and your gratitude —
          and to hear the Gospel afresh each day. No names. No accounts. Just grace.
        </motion.p>

        <motion.div
          className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          {...rise(0.8)}
        >
          {[
            {
              href: "/counsel",
              label: "Talk to the Counselor",
              icon: MessagesSquare,
              primary: true,
            },
            { href: "/community?new=1", label: "Share a Testimony", icon: HeartHandshake },
            { href: "/music", label: "Listen to Music", icon: Music },
          ].map(({ href, label, icon: Icon, primary }) => (
            <motion.div
              key={href}
              whileHover={reduce ? undefined : { scale: 1.03, y: -2 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            >
              <Button
                asChild
                size="lg"
                className={
                  primary
                    ? "w-full bg-gradient-to-b from-[#F1CE83] via-gold to-[#C08E2F] font-semibold text-[#33270F] shadow-[0_12px_38px_-12px_color-mix(in_oklab,var(--gold)_75%,transparent)] ring-1 ring-gold-foreground/10 hover:brightness-105 sm:w-auto"
                    : "w-full border-deep-foreground/25 bg-deep-foreground/8 text-deep-foreground backdrop-blur transition-colors hover:border-gold/40 hover:bg-deep-foreground/15 sm:w-auto"
                }
              >
                <Link href={href}>
                  <Icon className="mr-2 h-4 w-4" aria-hidden />
                  {label}
                </Link>
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* scroll cue */}
        <motion.div
          className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-gold/70 sm:flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.3em]">Scroll</span>
          <motion.span
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.span>
        </motion.div>
      </motion.div>

      {/* darkening veil as you scroll away — the "lights dim" effect */}
      <motion.div aria-hidden style={{ opacity: reduce ? 0 : veil }} className="pointer-events-none absolute inset-0 bg-black" />
    </section>
  );
}
