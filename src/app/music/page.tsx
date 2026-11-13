import type { Metadata } from "next";
import { MusicClient } from "@/components/site/music-client";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Worship Instrumentals",
  description:
    "Original instrumental compositions for prayer and rest — with a persistent player, album playlists, lyrics, and scripture references.",
  alternates: { canonical: "/music" },
  openGraph: {
    title: "Worship Instrumentals",
    description:
      "Original instrumental compositions for prayer and rest — with a persistent player, album playlists, lyrics, and scripture references.",
    url: "/music",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Daily Dose of Gospels" }],
  },
};

export default async function MusicPage() {
  const admin = await isAdmin();
  return <MusicClient isAdmin={admin} />;
}
