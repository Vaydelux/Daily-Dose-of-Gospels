import { Suspense } from "react";
import type { Metadata } from "next";
import { CommunityClient } from "@/components/community/community-client";

export const metadata: Metadata = {
  title: "Anonymous Christian Community",
  description:
    "Share testimonies, prayer requests, struggles, and encouragement — fully anonymous, moderated with care, and grounded in Christ.",
  alternates: { canonical: "/community" },
  openGraph: {
    title: "Anonymous Christian Community",
    description:
      "Share testimonies, prayer requests, struggles, and encouragement — fully anonymous, moderated with care, and grounded in Christ.",
    url: "/community",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Daily Dose of Gospels" }],
  },
};

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-10" aria-busy="true" />}>
      <CommunityClient />
    </Suspense>
  );
}
