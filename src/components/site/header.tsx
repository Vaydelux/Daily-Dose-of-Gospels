"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/site/global-search";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/community", label: "Community" },
  { href: "/counsel", label: "Counselor" },
  { href: "/verses", label: "Verses" },
  { href: "/bible", label: "Read Bible" },
  { href: "/music", label: "Music" },
  { href: "/faith", label: "Faith" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const reduce = useReducedMotion();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Daily Dose of Gospels — home">
          {/* Gold gradient cross medallion */}
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-[#3D4F84] to-[#1C2947] shadow-[0_4px_14px_-4px_rgb(18_26_43/0.5)] ring-1 ring-gold/30 transition-shadow group-hover:ring-gold/60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="url(#ddog-header-gold)" strokeWidth="2.2" strokeLinecap="round">
              <defs>
                <linearGradient id="ddog-header-gold" x1="0" y1="4" x2="0" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F1CE83" />
                  <stop offset="1" stopColor="#D7A748" />
                </linearGradient>
              </defs>
              <path d="M12 4v16M7.5 9h9" />
            </svg>
          </span>
          <span className="font-display text-[1.02rem] font-semibold tracking-tight transition-colors group-hover:text-gold-foreground dark:group-hover:text-gold sm:text-[1.08rem]">
            Daily Dose of Gospels
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-0.5 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative whitespace-nowrap rounded-md px-2.5 py-2 text-[0.88rem] font-medium tracking-[0.01em] transition-colors xl:px-3 xl:text-[0.92rem]",
                  active ? "text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-md bg-accent shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--gold)_25%,transparent)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    aria-hidden
                  />
                )}
                <span className="relative z-10">{item.label}</span>
                {!active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-2.5 bottom-1 h-px origin-left scale-x-0 bg-gradient-to-r from-gold/0 via-gold to-gold/0 transition-transform duration-300 group-hover:scale-x-100 hover:scale-x-100"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <GlobalSearch />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle dark mode"
            className="rounded-full"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Sun className="hidden h-4 w-4 dark:block" />
            <Moon className="h-4 w-4 dark:hidden" />
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav aria-label="Mobile navigation" className="flex gap-1 overflow-x-auto border-t border-border/50 px-2 py-1.5 md:hidden slim-scroll">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all",
              pathname === item.href
                ? "bg-primary text-primary-foreground shadow-[0_6px_18px_-8px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
