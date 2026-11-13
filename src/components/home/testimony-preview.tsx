import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeartHandshake, MessageSquareQuote } from "lucide-react";

export type PostPreview = {
  id: string;
  title: string;
  category: string;
  body: string;
  sameSituation: number;
  encouraged: number;
  commentCount: number;
  createdAt: Date;
};

const CATEGORY_LABEL: Record<string, string> = {
  TESTIMONY: "Testimony",
  PRAYER: "Prayer Request",
  STRUGGLES: "Struggles",
  ENCOURAGEMENT: "Encouragement",
  REFLECTION: "Bible Reflection",
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function TestimonyPreview({ posts }: { posts: PostPreview[] }) {
  return (
    <section aria-labelledby="latest-testimonies" className="">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="latest-testimonies" className="font-display text-xl font-semibold sm:text-2xl">
          Latest from the community
        </h2>
        <Link href="/community" className="text-sm font-medium text-primary hover:underline">
          View all →
        </Link>
      </div>

      {posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <MessageSquareQuote className="h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">The courtyard is quiet right now.</p>
            <p className="text-sm text-muted-foreground">
              Be the first to share what God is doing in your life — anonymously.
            </p>
            <Link
              href="/community?new=1"
              className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Share a testimony
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/community/${post.id}`} className="group">
              <Card className="lift h-full">
                <CardContent className="flex h-full flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[11px]">
                      {CATEGORY_LABEL[post.category] ?? post.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
                  </div>
                  <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug group-hover:underline">
                    {post.title}
                  </h3>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{post.body}</p>
                  <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
                      {post.sameSituation + post.encouraged}
                    </span>
                    <span>{post.commentCount} replies</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
