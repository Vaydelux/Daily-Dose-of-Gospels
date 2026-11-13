import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getDailyContent } from "@/lib/daily";
import { Hero } from "@/components/home/hero";
import { VerseCard } from "@/components/home/verse-card";
import { ParableCard } from "@/components/home/parable-card";
import { TestimonyPreview, type PostPreview } from "@/components/home/testimony-preview";
import { FeaturedSong } from "@/components/home/featured-song";
import { ArtGallery, ArtGalleryIntro, CraftedGallery, CraftedGalleryIntro } from "@/components/home/art-gallery";
import { ReadTheWordBand } from "@/components/home/read-the-word-band";
import { ContinueReading } from "@/components/home/continue-reading";
import { DeclarationBand } from "@/components/home/declaration-band";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

async function getLandingData() {
  const daily = getDailyContent(); // deterministic Scripture rotation — no AI, no DB
  const [posts, track] = await Promise.all([
    db.post.findMany({
      where: { hidden: false, category: { in: ["TESTIMONY", "ENCOURAGEMENT", "REFLECTION", "PRAYER", "STRUGGLES"] } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { _count: { select: { comments: { where: { hidden: false } } } } },
    }),
    db.track.findFirst({ where: { published: true }, orderBy: { playCount: "desc" } }),
  ]);

  const previews: PostPreview[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    body: p.body,
    sameSituation: p.sameSituation,
    encouraged: p.encouraged,
    commentCount: p._count.comments,
    createdAt: p.createdAt,
  }));

  return { daily, previews, track };
}

/** Quiet ornament divider between sections: — ✦ label ✦ — */
function SectionDivider({ label }: { label: string }) {
  return (
    <Reveal className="relative my-12 flex items-center justify-center gap-4" y={10}>
      <span aria-hidden className="h-px w-16 bg-gradient-to-r from-transparent to-gold/50 sm:w-28" />
      <span aria-hidden className="text-gold">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
          <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
        </svg>
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </span>
      <span aria-hidden className="text-gold">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
          <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
        </svg>
      </span>
      <span aria-hidden className="h-px w-16 bg-gradient-to-l from-transparent to-gold/50 sm:w-28" />
    </Reveal>
  );
}

export default async function HomePage() {
  const { daily, previews, track } = await getLandingData();

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-10">
      <Hero />

      {/* Ribbon bookmark laid across the homepage — resume the last reading */}
      <ContinueReading />

      <SectionDivider label="Today's manna" />

      {/* Daily content — staggered reveal */}
      <Stagger className="grid gap-6 lg:grid-cols-2">
        <StaggerItem>
          <VerseCard verse={daily} />
        </StaggerItem>
        <StaggerItem>
          <ParableCard parable={daily} />
        </StaggerItem>
      </Stagger>

      <SectionDivider label="From the courtyard" />

      <Reveal>
        <TestimonyPreview posts={previews} />
      </Reveal>

      <SectionDivider label="Behold" />

      <ArtGalleryIntro />
      <ArtGallery />

      <SectionDivider label="Drawn in code" />

      <CraftedGalleryIntro />
      <CraftedGallery />

      <SectionDivider label="Read the Word" />

      <Reveal>
        <ReadTheWordBand />
      </Reveal>

      <SectionDivider label="Going deeper" />

      <Stagger className="grid gap-6 lg:grid-cols-3">
        <StaggerItem>
          <FeaturedSong
            track={
              track
                ? { id: track.id, title: track.title, album: track.album, scripture: track.scripture, coverUrl: track.coverUrl }
                : null
            }
          />
        </StaggerItem>

        <StaggerItem>
          <section aria-labelledby="not-alone" className="verse-card lift flex h-full flex-col justify-between">
            <div>
              <h2 id="not-alone" className="font-display text-xl font-semibold">You are not alone.</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                When you share a struggle, we quietly look for others walking a similar road and
                introduce you — anonymously — so no one has to walk through the valley by themselves.
              </p>
            </div>
            <Link href="/community" className="mt-4 inline-block text-sm font-medium text-primary transition-colors hover:text-gold-foreground dark:hover:text-gold hover:underline">
              Find your people →
            </Link>
          </section>
        </StaggerItem>

        <StaggerItem>
          <section aria-labelledby="ai-counselor" className="verse-card lift flex h-full flex-col justify-between">
            <div>
              <h2 id="ai-counselor" className="font-display text-xl font-semibold">A counselor that prays first.</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Our AI counselor answers with real Scripture — quoting the Bible with its
                references, never inventing stories — and always leaves the decision with
                you. It can pray with you before offering counsel.
              </p>
              <p className="mt-2 text-xs italic text-muted-foreground">
                AI-assisted spiritual encouragement — not professional counseling.
              </p>
            </div>
            <Link href="/counsel" className="mt-4 inline-block text-sm font-medium text-primary transition-colors hover:text-gold-foreground dark:hover:text-gold hover:underline">
              Start a conversation →
            </Link>
          </section>
        </StaggerItem>
      </Stagger>

      {/* Closing confession — the cross at dawn, Christ exalted */}
      <div className="mt-16">
        <DeclarationBand />
      </div>
    </div>
  );
}
