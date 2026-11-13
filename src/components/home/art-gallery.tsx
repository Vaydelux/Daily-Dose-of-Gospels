import Image, { type StaticImageData } from "next/image";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";
import lightOverWater from "@/images/light-over-water.png";
import theGoodShepherd from "@/images/the-good-shepherd.png";
import openScripture from "@/images/open-scripture.png";
import stainedGlassCross from "@/images/stained-glass-cross.png";
import alphaOmega from "@/images/alpha-omega.png";
import livingWaters from "@/images/living-waters.png";

type ArtCardData = {
  src: StaticImageData;
  alt: string;
  refText: string;
  verse: string;
  reference: string;
};

/** All quotations are Scripture (KJV) — nothing invented. */
const CARDS: ArtCardData[] = [
  {
    src: lightOverWater,
    alt: "Golden light breaking through clouds over a calm sea, a beam touching the water",
    refText: "“I am the light of the world: he that followeth me shall not walk in darkness, but shall have the light of life.”",
    verse: "the light of the world",
    reference: "John 8:12",
  },
  {
    src: theGoodShepherd,
    alt: "A shepherd carrying a lamb on his shoulders, walking a hillside in golden evening light",
    refText: "“I am the good shepherd: the good shepherd giveth his life for the sheep.”",
    verse: "the good shepherd",
    reference: "John 10:11",
  },
  {
    src: openScripture,
    alt: "An open Bible glowing in warm lamplight with deep blue night at the window",
    refText: "“Thy word is a lamp unto my feet, and a light unto my path.”",
    verse: "a lamp unto my feet",
    reference: "Psalm 119:105",
  },
];

function ArtCard({ card }: { card: ArtCardData }) {
  return (
    <figure className="img-frame lift group relative h-72 sm:h-80">
      <Image
        src={card.src}
        alt={card.alt}
        fill
        placeholder="blur"
        sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 92vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      <div aria-hidden className="overlay-deep absolute inset-0" />
      <figcaption className="absolute inset-x-0 bottom-0 p-5 text-cream">
        <blockquote className="font-display text-[1.05rem] italic leading-snug text-shadow-luxe">
          {card.refText}
        </blockquote>
        <div className="mt-2 flex items-center gap-2">
          <span aria-hidden className="h-px w-6 bg-gold/70" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            {card.reference}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}

/** “Behold” — the site's own art collection, each piece anchored to Scripture. */
export function ArtGallery() {
  return (
    <Stagger className="grid gap-6 md:grid-cols-3">
      {CARDS.map((card) => (
        <StaggerItem key={card.reference}>
          <ArtCard card={card} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function ArtGalleryIntro() {
  return (
    <Reveal className="mx-auto mb-8 max-w-2xl text-center">
      <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Behold.
      </p>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
        Art made for this place — light over deep water, a shepherd who carries what
        was lost, and the Word kept glowing through the night. Every image rests on
        the verse it carries.
      </p>
    </Reveal>
  );
}

/** Pieces drawn in code — geometric sacred art, same navy + gold language. */
const CRAFTED: ArtCardData[] = [
  {
    src: stainedGlassCross,
    alt: "A golden cross in a leaded stained-glass rose of deep blue panes with rays of light",
    refText: "“But God forbid that I should glory, save in the cross of our Lord Jesus Christ.”",
    verse: "the cross of our Lord",
    reference: "Galatians 6:14",
  },
  {
    src: alphaOmega,
    alt: "A gold medallion ringed with fine tick marks holding the letters Alpha and Omega beneath a small crown",
    refText: "“I am Alpha and Omega, the beginning and the ending, saith the Lord.”",
    verse: "alpha and omega",
    reference: "Revelation 1:8",
  },
  {
    src: livingWaters,
    alt: "A golden sun over deep navy water with a column of light falling onto widening ripples",
    refText: "“Out of his belly shall flow rivers of living water.”",
    verse: "rivers of living water",
    reference: "John 7:38",
  },
];

export function CraftedGallery() {
  return (
    <Stagger className="grid gap-6 md:grid-cols-3">
      {CRAFTED.map((card) => (
        <StaggerItem key={card.reference}>
          <ArtCard card={card} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function CraftedGalleryIntro() {
  return (
    <Reveal className="mx-auto mb-8 max-w-2xl text-center">
      <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Drawn in code.
      </p>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
        The same verses rendered as geometry — leadlight, a medallion, still water —
        plotted line by line in this site&apos;s own navy and gold, with nothing
        invented beyond the Scripture they carry.
      </p>
    </Reveal>
  );
}
