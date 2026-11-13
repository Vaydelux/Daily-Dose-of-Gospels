import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem, ParallaxY } from "@/components/site/reveal";
import crossDawn from "@/images/cross-dawn.png";

export const metadata: Metadata = {
  title: "Jesus Is Lord — Statement of Faith",
  description:
    "The center of Daily Dose of Gospels: the Lordship of Jesus Christ — who He is, His death and resurrection, and the free gift of salvation — in the words of Scripture (KJV).",
  alternates: { canonical: "/faith" },
  openGraph: {
    title: "Jesus Is Lord — Statement of Faith",
    description:
      "The center of Daily Dose of Gospels: the Lordship of Jesus Christ — who He is, His death and resurrection, and the free gift of salvation — in the words of Scripture (KJV).",
    url: "/faith",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Daily Dose of Gospels" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jesus Is Lord — Statement of Faith",
    description:
      "The center of Daily Dose of Gospels: the Lordship of Jesus Christ, in the words of Scripture.",
    images: ["/opengraph-image"],
  },
};

/** Every quotation on this page is Scripture (KJV) — nothing here is invented. */

function Verse({ text, reference, className = "" }: { text: string; reference: string; className?: string }) {
  return (
    <blockquote className={`verse-card lift ${className}`}>
      <p className="font-display text-[1.02rem] italic leading-relaxed">{text}</p>
      <footer className="mt-3 flex items-center gap-2">
        <span aria-hidden className="h-px w-6 bg-gold/60" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
          {reference}
        </span>
      </footer>
    </blockquote>
  );
}

function SectionHeading({ id, eyebrow, title, intro }: { id: string; eyebrow: string; title: string; intro?: string }) {
  return (
    <Reveal className="mx-auto mb-8 max-w-2xl text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-gold">{eyebrow}</p>
      <h2 id={id} className="mt-3 scroll-mt-24 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {intro && <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">{intro}</p>}
    </Reveal>
  );
}

export default function FaithPage() {
  return (
    <div className="pb-24">
      {/* ── Hero: the cross at dawn ─────────────────────────────────── */}
      <ParallaxY amount={26}>
        <section className="img-frame relative isolate mx-auto mt-8 max-w-6xl overflow-hidden sm:mx-6 lg:mx-auto">
          <div className="relative h-[62vh] min-h-[420px] w-full sm:h-[68vh]">
            <Image
              src={crossDawn}
              alt="A wooden cross on a quiet hill at golden dawn, light breaking through deep blue clouds"
              fill
              placeholder="blur"
              priority
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-[rgb(15_25_44/0.35)]" />
            <div aria-hidden className="overlay-deep absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 mx-auto max-w-3xl px-6 pb-14 text-center sm:pb-16">
              <Reveal>
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-gold">
                  The center of everything we build here
                </p>
                <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-cream text-shadow-luxe sm:text-6xl">
                  Jesus Christ is Lord
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-[1rem] leading-relaxed text-cream/90 text-shadow-luxe">
                  Not a slogan. Not a decoration. The risen Son of God — Savior, King,
                  and the name this whole place leans on. Every word below is Scripture.
                </p>
              </Reveal>
            </div>
          </div>
        </section>
      </ParallaxY>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* ── The name above every name ─────────────────────────────── */}
        <section aria-labelledby="faith-confess" className="mt-20">
          <SectionHeading
            id="faith-confess"
            eyebrow="Our confession"
            title="The name above every name"
            intro="This is why this site exists — that every tongue should confess Him."
          />
          <Reveal>
            <Verse
              className="mx-auto max-w-3xl border-gold/30 bg-card/80"
              text="“Wherefore God also hath highly exalted him, and given him a name which is above every name: that at the name of Jesus every knee should bow, of things in heaven, and things in earth, and things under the earth; and that every tongue should confess that Jesus Christ is Lord, to the glory of God the Father.”"
              reference="Philippians 2:9–11"
            />
          </Reveal>
        </section>

        {/* ── He is God the Son ─────────────────────────────────────── */}
        <section aria-labelledby="faith-son" className="mt-20">
          <SectionHeading
            id="faith-son"
            eyebrow="Who He is"
            title="He is God the Son"
            intro="Not a teacher among teachers — the Word made flesh, in whom all things hold together."
          />
          <Stagger className="grid gap-5 md:grid-cols-3">
            <StaggerItem>
              <Verse
                text="“And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.”"
                reference="John 1:14"
              />
            </StaggerItem>
            <StaggerItem>
              <Verse
                text="“For by him were all things created… all things were created by him, and for him: and he is before all things, and by him all things consist.”"
                reference="Colossians 1:16–17"
              />
            </StaggerItem>
            <StaggerItem>
              <Verse text="“I and my Father are one.”" reference="John 10:30" />
            </StaggerItem>
          </Stagger>
        </section>

        {/* ── He died and rose again ────────────────────────────────── */}
        <section aria-labelledby="faith-cross" className="mt-20">
          <SectionHeading
            id="faith-cross"
            eyebrow="What He did"
            title="He died for our sins — and rose again"
            intro="The heart of the Gospel: Christ took what was ours, and gave what we could never earn."
          />
          <Stagger className="grid gap-5 md:grid-cols-3">
            <StaggerItem>
              <Verse
                text="“For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; and that he was buried, and that he rose again the third day according to the scriptures.”"
                reference="1 Corinthians 15:3–4"
              />
            </StaggerItem>
            <StaggerItem>
              <Verse
                text="“For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.”"
                reference="John 3:16"
              />
            </StaggerItem>
            <StaggerItem>
              <Verse
                text="“But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.”"
                reference="Romans 5:8"
              />
            </StaggerItem>
          </Stagger>
        </section>

        {/* ── The only way ──────────────────────────────────────────── */}
        <section aria-labelledby="faith-way" className="mt-20">
          <SectionHeading
            id="faith-way"
            eyebrow="Why He came"
            title="He is the only way home"
            intro="We say it gently, because He said it first — and we will not soften what Scripture makes clear."
          />
          <Stagger className="grid gap-5 md:grid-cols-2">
            <StaggerItem>
              <Verse
                text="“Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.”"
                reference="John 14:6"
              />
            </StaggerItem>
            <StaggerItem>
              <Verse
                text="“Neither is there salvation in any other: for there is none other name under heaven given among men, whereby we must be saved.”"
                reference="Acts 4:12"
              />
            </StaggerItem>
          </Stagger>
        </section>

        {/* ── Confess Him today ─────────────────────────────────────── */}
        <section aria-labelledby="faith-invitation" className="mt-20">
          <SectionHeading
            id="faith-invitation"
            eyebrow="An open invitation"
            title="Confess Him today"
            intro="Salvation is not a staircase to climb. It is a name to call upon — freely, right now, wherever you are."
          />
          <Reveal>
            <Verse
              className="mx-auto max-w-3xl border-gold/30 bg-card/80"
              text="“That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved. For with the heart man believeth unto righteousness; and with the mouth confession is made unto salvation.”"
              reference="Romans 10:9–10"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <Verse
              className="mx-auto mt-5 max-w-3xl"
              text="“For whosoever shall call upon the name of the Lord shall be saved.”"
              reference="Romans 10:13"
            />
          </Reveal>

          {/* A prayer of surrender — a human response, anchored to Romans 10:9 */}
          <Reveal delay={0.15}>
            <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-gold/25 bg-gradient-to-b from-card to-secondary/40 p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
                If you are ready — in your own words, you might pray
              </p>
              <p className="mt-4 font-display text-[1.05rem] italic leading-relaxed">
                “Lord Jesus, I believe You are the Son of God. I confess my sin, and I
                confess You as my Lord and my Savior. I believe God raised You from the
                dead. Come into my heart, lead my life, and help me to follow You all
                my days. Amen.”
              </p>
              <p className="mt-4 text-[0.85rem] leading-relaxed text-muted-foreground">
                If you prayed that, tell someone. Share it anonymously in the
                community, or talk it through with the counselor — either one will
                meet you with grace, not judgment.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/community"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-[#F1CE83] via-[#D7A748] to-[#C08E2F] px-6 py-2.5 text-sm font-semibold text-[#2A1E07] shadow-[0_12px_30px_-12px_rgb(202_156_72/0.65)] transition-all hover:-translate-y-0.5"
                >
                  Share it anonymously →
                </Link>
                <Link
                  href="/counsel"
                  className="inline-flex items-center justify-center rounded-full border border-border px-6 py-2.5 text-sm font-medium transition-all hover:border-gold/60 hover:text-gold-foreground dark:hover:text-gold"
                >
                  Talk with the Counselor
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── How this shapes the site ──────────────────────────────── */}
        <section aria-labelledby="faith-practice" className="mt-20">
          <SectionHeading
            id="faith-practice"
            eyebrow="What it means here"
            title="How His Lordship shapes this place"
          />
          <Stagger className="grid gap-5 md:grid-cols-3">
            <StaggerItem>
              <div className="verse-card lift h-full">
                <h3 className="font-display text-lg font-semibold">Scripture first</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  The daily verse and parable are drawn from the Bible itself — never
                  invented, never padded.
                </p>
                <p className="mt-3 font-display text-[0.92rem] italic text-muted-foreground">
                  “All scripture is given by inspiration of God…”
                  <span className="ml-1 text-[11px] font-semibold not-italic uppercase tracking-[0.2em] text-gold">2 Timothy 3:16</span>
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="verse-card lift h-full">
                <h3 className="font-display text-lg font-semibold">Prayer before counsel</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  The counselor prays before it advises, and answers with real
                  Scripture and its references — always leaving the decision with you.
                </p>
                <p className="mt-3 font-display text-[0.92rem] italic text-muted-foreground">
                  “If any of you lack wisdom, let him ask of God…”
                  <span className="ml-1 text-[11px] font-semibold not-italic uppercase tracking-[0.2em] text-gold">James 1:5</span>
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="verse-card lift h-full">
                <h3 className="font-display text-lg font-semibold">Anonymity with grace</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  No names, no profiles — because we come as we are, and He already
                  knows. Grace does not need your real name.
                </p>
                <p className="mt-3 font-display text-[0.92rem] italic text-muted-foreground">
                  “Neither is there any creature that is not manifest in his sight…”
                  <span className="ml-1 text-[11px] font-semibold not-italic uppercase tracking-[0.2em] text-gold">Hebrews 4:13</span>
                </p>
              </div>
            </StaggerItem>
          </Stagger>
        </section>

        {/* ── Closing ───────────────────────────────────────────────── */}
        <Reveal className="mt-20">
          <div className="rounded-2xl border border-border/70 bg-deep px-6 py-12 text-center text-deep-foreground sm:px-12">
            <p className="font-display text-2xl italic leading-relaxed sm:text-3xl">
              “For of him, and through him, and to him, are all things: to whom be
              glory for ever. Amen.”
            </p>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
              Romans 11:36
            </p>
            <Link
              href="/verses"
              className="mt-8 inline-flex items-center rounded-full border border-deep-foreground/30 px-6 py-2.5 text-sm font-medium transition-all hover:border-gold/70 hover:text-gold"
            >
              Find verses for what you carry →
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
