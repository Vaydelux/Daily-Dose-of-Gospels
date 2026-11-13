import { cn } from "@/lib/utils";

/**
 * AmbientBackdrop — the cinematic atmosphere behind every page.
 * Pure CSS layers (no JS cost):
 *   1. fine blueprint grid          — quiet structure
 *   2. large gold "cathedral" grid  — stained-glass frame
 *   3. two slow aurora glow blobs   — candlelight warmth
 *   4. a few twinkling dust motes   — incense in the light
 * Fixed, pointer-transparent, and rendered behind all content.
 */
const DUST = [
  { left: "8%", top: "22%", size: 3, delay: "0s", duration: "6.5s" },
  { left: "18%", top: "64%", size: 2, delay: "1.2s", duration: "7.5s" },
  { left: "27%", top: "38%", size: 4, delay: "2.1s", duration: "6s" },
  { left: "38%", top: "78%", size: 2, delay: "0.6s", duration: "8s" },
  { left: "47%", top: "18%", size: 3, delay: "3.2s", duration: "7s" },
  { left: "58%", top: "56%", size: 2, delay: "1.8s", duration: "6.8s" },
  { left: "66%", top: "30%", size: 4, delay: "2.7s", duration: "7.8s" },
  { left: "74%", top: "70%", size: 3, delay: "0.9s", duration: "6.2s" },
  { left: "83%", top: "42%", size: 2, delay: "3.8s", duration: "8.2s" },
  { left: "91%", top: "60%", size: 3, delay: "1.5s", duration: "7.2s" },
  { left: "12%", top: "86%", size: 2, delay: "4.4s", duration: "7.6s" },
  { left: "94%", top: "14%", size: 2, delay: "2.4s", duration: "6.4s" },
] as const;

export function AmbientBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className
      )}
    >
      {/* Layer 1 — fine grid, radially faded so it melts into the page */}
      <div className="bg-grid mask-radial-fade absolute inset-0" />

      {/* Layer 2 — large gold grid, very faint, fades toward the bottom */}
      <div className="bg-grid-lg mask-fade-b absolute inset-0 opacity-50" />

      {/* Layer 3 — aurora glows */}
      <div
        className="aurora absolute -top-32 left-1/2 h-[34rem] w-[54rem] max-w-none -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--gold) 26%, transparent), transparent)",
        }}
      />
      <div
        className="aurora-slow absolute -bottom-40 -left-24 h-[28rem] w-[38rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--gold) 14%, transparent), transparent)",
        }}
      />

      {/* Layer 4 — dust motes */}
      {DUST.map((d, i) => (
        <span
          key={i}
          className="dust absolute rounded-full bg-gold"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            animationDelay: d.delay,
            animationDuration: d.duration,
          }}
        />
      ))}
    </div>
  );
}
