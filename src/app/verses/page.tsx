import type { Metadata } from "next";
import { VersesClient } from "@/components/site/verses-client";

export const metadata: Metadata = {
  title: "Bible Verses by Theme",
  description:
    "Bible verses for anxiety, forgiveness, hope, grief, fear, purpose, finances, and relationships — searchable and saveable to your device, no account needed.",
  alternates: { canonical: "/verses" },
  openGraph: {
    title: "Bible Verses by Theme",
    description:
      "Bible verses for anxiety, forgiveness, hope, grief, fear, purpose, finances, and relationships — searchable and saveable to your device, no account needed.",
    url: "/verses",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Daily Dose of Gospels" }],
  },
};

export default function VersesPage() {
  return <VersesClient />;
}
