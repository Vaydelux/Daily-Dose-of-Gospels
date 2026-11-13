import type { Metadata } from "next";
import { PostDetail } from "@/components/community/post-detail";
import { db } from "@/lib/db";

const CATEGORY_LABELS: Record<string, string> = {
  TESTIMONY: "Testimony",
  PRAYER: "Prayer Request",
  STRUGGLES: "Struggle",
  ENCOURAGEMENT: "Encouragement",
  REFLECTION: "Reflection",
};

const OG_IMAGE = [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Daily Dose of Gospels" }];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const post = await db.post.findUnique({
      where: { id },
      select: {
        title: true,
        body: true,
        category: true,
        hidden: true,
        crisisFlag: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Hidden (moderated) or deleted posts must stay out of search indexes.
    // Crisis-flagged posts (self-harm / abuse) are also excluded from search
    // engines so vulnerable readers never land on them from a search result.
    if (!post || post.hidden || post.crisisFlag) {
      return {
        title: "Post",
        robots: { index: false, follow: false },
      };
    }

    const label = CATEGORY_LABELS[post.category] ?? "Community";
    const excerpt =
      post.body.length > 155 ? `${post.body.slice(0, 155).trimEnd()}…` : post.body;

    return {
      title: `${post.title} — ${label}`,
      description: excerpt,
      alternates: { canonical: `/community/${id}` },
      openGraph: {
        title: post.title,
        description: excerpt,
        url: `/community/${id}`,
        type: "article",
        publishedTime: post.createdAt.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        images: OG_IMAGE,
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: excerpt,
        images: ["/opengraph-image"],
      },
    };
  } catch {
    return { title: "Post" };
  }
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetail id={id} />;
}
