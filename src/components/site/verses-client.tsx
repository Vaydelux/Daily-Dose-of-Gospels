"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { VERSES, THEMES, type ThemeKey } from "@/lib/verses-bank";
import { useFavorites } from "@/lib/favorites-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";
import { Bookmark, BookmarkCheck, Search } from "lucide-react";
import livingWaters from "@/images/living-waters.png";

/** Hero anchor quotation — Scripture only (KJV). */
const HERO_VERSE = {
  text: "Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.",
  ref: "Matthew 4:4",
};

export function VersesClient() {
  const [theme, setTheme] = useState<ThemeKey | "ALL" | "FAVORITES">("ALL");
  const [query, setQuery] = useState("");
  const [favorites, toggleFavorite] = useFavorites();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VERSES.filter((v) => {
      if (theme === "FAVORITES" && !favorites.includes(v.ref)) return false;
      if (theme !== "ALL" && theme !== "FAVORITES" && v.theme !== theme) return false;
      if (q && !(v.ref.toLowerCase().includes(q) || v.text.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [theme, query, favorites]);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-10">
      {/* Art hero — living waters, the Word as the river of life */}
      <section aria-label="Verses for the road" className="img-frame relative isolate overflow-hidden">
        <Image
          src={livingWaters}
          alt="Golden sun over deep still water, a column of light touching the sea beneath it"
          fill
          placeholder="blur"
          sizes="(min-width: 896px) 896px, 92vw"
          className="object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-[rgb(15_25_44/0.48)]" />
        <div aria-hidden className="overlay-deep absolute inset-0 rotate-180" />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center px-6 py-16 text-center sm:py-20">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-gold">
              Verses for the road
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-cream text-shadow-luxe sm:text-4xl">
              Scripture for whatever you are carrying.
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <blockquote className="mt-5 font-display text-base italic leading-relaxed text-cream/95 text-shadow-luxe sm:text-lg">
              &ldquo;{HERO_VERSE.text}&rdquo;
            </blockquote>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
              {HERO_VERSE.ref} · KJV
            </p>
          </Reveal>
        </div>
      </section>

      <Reveal className="mt-8">
        <p className="mx-auto max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
          Search by a word or a reference, keep favorites on this device — no account
          needed, and the list never leaves your browser.
        </p>
      </Reveal>

      <Reveal className="mt-6 flex flex-col gap-3 sm:flex-row" y={12}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a word or reference — e.g. peace, Psalm 23"
            aria-label="Search verses"
            className="pl-9"
          />
        </div>
        {favorites.length > 0 ? (
          <Button
            variant={theme === "FAVORITES" ? "default" : "outline"}
            onClick={() => setTheme(theme === "FAVORITES" ? "ALL" : "FAVORITES")}
            aria-pressed={theme === "FAVORITES"}
          >
            <BookmarkCheck className="mr-1.5 h-4 w-4" aria-hidden />
            My favorites · {favorites.length}
          </Button>
        ) : null}
      </Reveal>

      <Reveal className="mt-4" y={12}>
        <Tabs value={theme === "FAVORITES" ? "ALL" : theme} onValueChange={(v) => setTheme(v as ThemeKey | "ALL")}>
          <TabsList className="slim-scroll flex w-full flex-wrap justify-start gap-1.5 bg-transparent p-0">
            <TabsTrigger
              value="ALL"
              className="rounded-full border border-border data-[state=active]:border-gold/50 data-[state=active]:bg-deep data-[state=active]:text-cream"
            >
              All
            </TabsTrigger>
            {THEMES.map((t) => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className="rounded-full border border-border data-[state=active]:border-gold/50 data-[state=active]:bg-deep data-[state=active]:text-cream"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Reveal>

      <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">
        {filtered.length} verse{filtered.length === 1 ? "" : "s"}
        {theme !== "ALL" && theme !== "FAVORITES" ? ` · ${THEMES.find((t) => t.key === theme)?.blurb}` : ""}
      </p>

      <Stagger className="mt-3 grid gap-4 sm:grid-cols-2" aria-live="polite">
        {filtered.length === 0 ? (
          <StaggerItem className="sm:col-span-2">
            <article className="verse-card text-center text-sm text-muted-foreground">
              {theme === "FAVORITES"
                ? "No favorites yet — tap the bookmark on any verse to keep it here."
                : "No verses match that search — try another word."}
            </article>
          </StaggerItem>
        ) : (
          filtered.map((v) => {
            const fav = favorites.includes(v.ref);
            return (
              <StaggerItem key={`${v.theme}-${v.ref}`}>
                <article className="verse-card lift flex h-full flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[11px] font-medium text-gold-foreground dark:text-gold">
                      {THEMES.find((t) => t.key === v.theme)?.label}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(v.ref)}
                      aria-pressed={fav}
                      aria-label={fav ? `Remove ${v.ref} from favorites` : `Save ${v.ref} to favorites`}
                    >
                      {fav ? <BookmarkCheck className="h-4 w-4 text-gold" /> : <Bookmark className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="mt-3 flex-1 font-display text-[0.98rem] leading-relaxed">
                    &ldquo;{v.text}&rdquo;
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span aria-hidden className="h-px w-6 bg-gold/70" />
                    <p className="text-sm font-semibold text-gold-foreground dark:text-gold">— {v.ref}</p>
                  </div>
                </article>
              </StaggerItem>
            );
          })
        )}
      </Stagger>
    </div>
  );
}
