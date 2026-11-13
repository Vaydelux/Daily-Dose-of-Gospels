import type { Metadata } from "next";
import { CounselClient } from "@/components/site/counsel-client";

export const metadata: Metadata = {
  title: "AI Christian Counselor",
  description:
    "A gentle, Christ-centered AI counselor that prays first, answers from real Scripture with its references, never invents stories, and always leaves the decision with you. Anonymous.",
  alternates: { canonical: "/counsel" },
  openGraph: {
    title: "AI Christian Counselor",
    description:
      "A gentle, Christ-centered AI counselor that prays first, answers from real Scripture with its references, never invents stories, and always leaves the decision with you. Anonymous.",
    url: "/counsel",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Daily Dose of Gospels" }],
  },
};

export default function CounselPage() {
  return <CounselClient />;
}
