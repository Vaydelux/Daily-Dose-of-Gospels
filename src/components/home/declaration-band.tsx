import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import crossDawn from "@/images/cross-dawn.png";

/**
 * The site's confession — the closing band of the home page.
 * Scripture quotations: Philippians 2:10–11 and Romans 10:9 (KJV).
 */
export function DeclarationBand() {
  return (
    <section
      aria-label="Jesus Christ is Lord — our confession"
      className="img-frame relative isolate overflow-hidden"
    >
      <Image
        src={crossDawn}
        alt="A wooden cross on a hill at golden dawn, light breaking through deep blue clouds"
        fill
        placeholder="blur"
        sizes="100vw"
        className="object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-[rgb(15_25_44/0.55)]" />
      <div aria-hidden className="overlay-deep absolute inset-0 rotate-180" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center sm:px-12 sm:py-24">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-gold">
            Our confession
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-cream text-shadow-luxe sm:text-5xl">
            Jesus Christ is Lord
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <blockquote className="mt-6 font-display text-lg italic leading-relaxed text-cream/95 text-shadow-luxe sm:text-xl">
            “That at the name of Jesus every knee should bow, of things in heaven,
            and things in earth, and things under the earth; and that every tongue
            should confess that Jesus Christ is Lord, to the glory of God the Father.”
          </blockquote>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
            Philippians 2:10–11 · KJV
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mt-8 max-w-xl text-[0.98rem] leading-relaxed text-cream/85">
            “That if thou shalt confess with thy mouth the Lord Jesus, and shalt
            believe in thine heart that God hath raised him from the dead, thou
            shalt be saved.”
            <span className="ml-2 text-xs font-semibold uppercase not-italic tracking-[0.22em] text-gold">
              Romans 10:9
            </span>
          </p>
        </Reveal>

        <Reveal delay={0.28}>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/faith"
              className="inline-flex items-center rounded-full bg-gradient-to-b from-[#F1CE83] via-[#D7A748] to-[#C08E2F] px-7 py-3 text-sm font-semibold text-[#2A1E07] shadow-[0_14px_34px_-12px_rgb(202_156_72/0.65)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgb(202_156_72/0.8)]"
            >
              Read our statement of faith →
            </Link>
            <Link
              href="/counsel"
              className="inline-flex items-center rounded-full border border-cream/30 px-7 py-3 text-sm font-medium text-cream backdrop-blur-sm transition-all hover:border-gold/70 hover:text-gold"
            >
              Begin with the Counselor
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
