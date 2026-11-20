"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PostForm } from "@/components/community/post-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PostCardSkeleton, LoadingBanner } from "@/components/site/skeletons";
import { Alert } from "@/components/ui/alert";
import { HeartHandshake, MessageSquareQuote, PenLine, Sparkles } from "lucide-react";

type Post = {
  id: string;
  category: string;
  title: string;
  body: string;
  sameSituation: number;
  encouraged: number;
  crisisFlag: boolean;
  commentCount: number;
  createdAt: string;
};

const CATEGORIES = [
  { key: "ALL", label: "All" },
  { key: "TESTIMONY", label: "Testimonies" },
  { key: "PRAYER", label: "Prayer Requests" },
  { key: "STRUGGLES", label: "Struggles" },
  { key: "ENCOURAGEMENT", label: "Encouragement" },
  { key: "REFLECTION", label: "Bible Reflections" },
] as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function CommunityClient() {
  const searchParams = useSearchParams();
  const [formOpen, setFormOpen] = useState(searchParams.get("new") === "1");
  const [category, setCategory] = useState<string>("ALL");
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCategoryChange = useCallback((nextCategory: string) => {
    setCategory(nextCategory);
    setPosts(null);
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;
    async function fetchPosts() {
      try {
        const res = await fetch(`/api/posts?category=${encodeURIComponent(category)}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { posts: Post[] };
        if (active) setPosts(data.posts);
      } catch {
        if (active) setError("We couldn't load the community right now — please refresh in a moment.");
      }
    }
    void fetchPosts();
    return () => {
      active = false;
    };
  }, [category]);

  const emptyCopy = useMemo(() => {
    if (category === "TESTIMONY") return "No testimonies yet — yours could be the first spark of hope someone reads today.";
    if (category === "PRAYER") return "No prayer requests yet. Whatever you carry, you can lay it down here.";
    return "Nothing here yet — be the gentle first voice.";
  }, [category]);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-8">
      <header className="fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Community</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            A safe, anonymous courtyard for testimonies, prayers, struggles, and encouragement.
            Everything you share stays anonymous — no names, no accounts.
          </p>
        </div>
        <Button size="lg" onClick={() => setFormOpen(true)}>
          <PenLine className="mr-2 h-4 w-4" aria-hidden />
          New post
        </Button>
      </header>

      <Tabs value={category} onValueChange={handleCategoryChange} className="mt-6">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 overflow-x-auto bg-transparent p-0 slim-scroll">
          {CATEGORIES.map((c) => (
            <TabsTrigger
              key={c.key}
              value={c.key}
              className="rounded-full border border-border data-[state=active]:border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-6 space-y-4" aria-live="polite">
        {error ? (
          <Alert variant="destructive">{error}</Alert>
        ) : posts === null ? (
          <div>
            <div className="mb-6 flex justify-center">
              <LoadingBanner label="Gathering stories" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <PostCardSkeleton key={i} />)}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
              <MessageSquareQuote className="h-8 w-8 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">{emptyCopy}</p>
              <Button variant="outline" className="mt-2" onClick={() => setFormOpen(true)}>
                Write the first one
              </Button>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <a key={post.id} href={`/community/${post.id}`} className="group block">
              <Card className="transition-shadow group-hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-secondary-foreground">
                      {CATEGORIES.find((c) => c.key === post.category)?.label ?? post.category}
                    </span>
                    <span>{timeAgo(post.createdAt)}</span>
                    {post.crisisFlag ? (
                      <span className="rounded-full border border-gold/60 px-2 py-0.5 text-[11px] text-gold-foreground">
                        held with care
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 font-display text-lg font-semibold leading-snug group-hover:underline">
                    {post.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.body}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <HeartHandshake className="h-3.5 w-3.5" aria-hidden /> {post.sameSituation}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden /> {post.encouraged}
                    </span>
                    <span>{post.commentCount} replies</span>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))
        )}
      </div>

      <PostForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
