import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Daily Dose of Gospels protects your anonymity: no names, no emails, no profiles, no IP addresses stored.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy",
    description: "How Daily Dose of Gospels protects your anonymity: no names, no emails, no profiles, no IP addresses stored.",
    url: "/privacy",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Daily Dose of Gospels" }],
  },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10">
      <h1 className="font-display text-3xl font-bold">Privacy</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: November 12, 2026</p>

      <div className="mt-8 space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-semibold">What we never collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>No names, email addresses, phone numbers, or account profiles.</li>
              <li>No IP addresses in our database. IPs are hashed in memory for a few minutes to apply rate limits, then gone.</li>
              <li>No third-party analytics or advertising trackers.</li>
              <li>Posts and comments pass through a PII filter that removes emails, phone numbers, links, handles, and self-introductions before they are stored.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-semibold">What keeps you anonymous</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A random token lives in an HTTP-only cookie on your device. From it we derive a
              display name like <span className="font-medium text-foreground">“Faithful Sparrow 4821”</span> —
              stable enough that people can recognize you across visits, meaningless enough that it
              says nothing about who you are. Clearing your browser cookies gives you a brand-new identity.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-semibold">What the AI counselor remembers</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              So the counselor can greet you with continuity, it keeps a small anonymous memory:
              the themes you walk through (e.g. grief, work stress), your current concerns, whether
              you have prayed together, and two sentences of gentle context. It is linked to your
              random session — never to a person. The <Link href="/counsel" className="font-medium text-primary hover:underline">“Clear my memory”</Link> button
              deletes it permanently, immediately.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              To save computing power, similar questions may reuse previously written counsel
              (a semantic cache). Cache entries are anonymous text, stripped of personal details.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-semibold">Favorites on your device</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Saved verses in /verses and scripture cards in the chat are stored in your
              browser&apos;s localStorage. They never leave your device and are not backed up by us.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-semibold">Moderation & safety</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Posts, comments, and chat messages pass automated safety checks. Crisis signals
              (self-harm, abuse) trigger compassionate support resources — we never share them with
              anyone, including authorities, because we have no idea who you are. Community reports
              hide harmful content after a few reports until a moderator reviews it.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
