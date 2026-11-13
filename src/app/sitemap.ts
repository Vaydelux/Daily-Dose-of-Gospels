import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://dailydoseofgospels.com").replace(/\/$/, "");

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/verses`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/bible`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/community`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/counsel`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/music`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/faith`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Published community posts are indexable long-tail pages — include them.
  try {
    const posts = await db.post.findMany({
      where: { hidden: false },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 2000,
    });
    const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${SITE_URL}/community/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    }));
    return [...staticEntries, ...postEntries];
  } catch {
    // DB unavailable (e.g. during a cold build) — ship the static map.
    return staticEntries;
  }
}
