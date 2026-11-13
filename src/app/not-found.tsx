import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import theGoodShepherd from "@/images/the-good-shepherd.png";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-14">
      <Reveal>
        <div className="img-frame relative isolate overflow-hidden">
          <div className="relative h-72 w-full sm:h-80">
            <Image
              src={theGoodShepherd}
              alt="A shepherd carrying a lost lamb on his shoulders in golden light"
              fill
              placeholder="blur"
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
            <div aria-hidden className="overlay-deep absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-gold">
                Page not found · 404
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold text-cream text-shadow-luxe sm:text-4xl">
                This page wandered off.
              </h1>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mx-auto mt-8 max-w-xl text-center">
          <p className="font-display text-[1.05rem] italic leading-relaxed text-muted-foreground">
            “What man of you, having an hundred sheep, if he lose one of them, doth not
            leave the ninety and nine in the wilderness, and go after that which is
            lost, until he find it?”
          </p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            Luke 15:4
          </p>
          <p className="mt-5 text-[0.95rem] leading-relaxed text-muted-foreground">
            You are not lost to Him — and you do not have to wander this site alone
            either. Let us take you somewhere quiet.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center rounded-full bg-gradient-to-b from-[#F1CE83] via-[#D7A748] to-[#C08E2F] px-7 py-3 text-sm font-semibold text-[#2A1E07] shadow-[0_14px_34px_-12px_rgb(202_156_72/0.65)] transition-all hover:-translate-y-0.5"
            >
              ← Back home
            </Link>
            <Link
              href="/verses"
              className="inline-flex items-center rounded-full border border-border px-7 py-3 text-sm font-medium transition-all hover:border-gold/60 hover:text-gold-foreground dark:hover:text-gold"
            >
              Find a verse instead
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
