import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for Daily Dose of Gospels — a community of grace, with honest disclaimers about AI-assisted encouragement.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Use",
    description: "Terms of use for Daily Dose of Gospels — a community of grace, with honest disclaimers about AI-assisted encouragement.",
    url: "/terms",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Daily Dose of Gospels" }],
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10">
      <h1 className="font-display text-3xl font-bold">Terms of Use</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: November 12, 2026</p>

      <div className="mt-8 space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-semibold">1. A house of grace</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Daily Dose of Gospels exists to encourage people with the hope of Jesus Christ.
              By participating you agree to speak with the gentleness you would want receive —
              no harassment, hate speech, sexual content, doxxing, spam, or solicitation.
              We may hide or remove content that breaks this, automatically or through moderation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-semibold">2. The AI counselor — honest disclaimers</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>The counselor is an AI, not a pastor, priest, licensed therapist, doctor, or lawyer.</li>
              <li>AI-assisted spiritual encouragement is not professional counseling and cannot diagnose or treat anything.</li>
              <li>In medical, legal, abuse, or self-harm situations, seek qualified professionals and trusted people — the counselor will tell you the same.</li>
              <li>The AI can make mistakes, including about Scripture references. Test everything; keep what is good (1 Thessalonians 5:21).</li>
              <li>You make your own decisions. Counsel offered is counsel offered — never a command.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-semibold">3. Your content</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You keep ownership of what you write. By posting you give us permission to display it
              anonymously in this community and to moderate it. Do not share what is not yours to
              share, and never post another person&apos;s private information — a filter removes
              obvious identifiers, but you are the first line of care.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-semibold">4. Music</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Compositions published in the Music room are shared here for personal listening,
              prayer, and encouragement. They may not be redistributed or sold without the
              owner&apos;s permission.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-semibold">5. Availability</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The service is offered as-is, without warranty. We may change or pause features at any
              time. If a crisis moment ever outweighs anything a website can offer: please contact
              your local emergency number or a crisis line — in the Philippines, NCMH 1553 (toll-free)
              or 911; elsewhere, findahelpline.com.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
