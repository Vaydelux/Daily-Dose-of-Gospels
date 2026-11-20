"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PostDetailSkeleton } from "@/components/site/skeletons";
import { ReactionButtons } from "@/components/community/reaction-buttons";
import { SimilarPosts } from "@/components/community/similar-posts";
import { CrisisBanner } from "@/components/community/crisis-banner";
import { ReportDialog } from "@/components/community/report-dialog";
import { CRISIS_BANNER } from "@/lib/crisis-static";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Flag, Send } from "lucide-react";

type Detail = {
  post: {
    id: string;
    category: string;
    title: string;
    body: string;
    crisisFlag: boolean;
    sameSituation: number;
    encouraged: number;
    createdAt: string;
    authorName: string;
    commentCount: number;
    mine: boolean;
  };
  comments: Array<{
    id: string;
    body: string;
    crisisFlag: boolean;
    createdAt: string;
    authorName: string;
    mine: boolean;
  }>;
  myReactions: string[];
};

const CATEGORY_LABEL: Record<string, string> = {
  TESTIMONY: "Testimony",
  PRAYER: "Prayer Request",
  STRUGGLES: "Struggles",
  ENCOURAGEMENT: "Encouragement",
  REFLECTION: "Bible Reflection",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function PostDetail({ id }: { id: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCommentId, setReportCommentId] = useState<string | undefined>(undefined);
  const [commentCrisis, setCommentCrisis] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error();
      setData((await res.json()) as Detail);
    } catch {
      toast({ title: "Couldn't load this post — please refresh.", variant: "destructive" });
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (res.status === 404) {
          if (active) setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error();
        const detail = (await res.json()) as Detail;
        if (active) setData(detail);
      } catch {
        if (active) toast({ title: "Couldn't load this post — please refresh.", variant: "destructive" });
      }
    }
    void fetchDetail();
    return () => {
      active = false;
    };
  }, [id]);

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    if (sending || comment.trim().length < 2) return;
    setSending(true);
    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: comment }),
      });
      const d = (await res.json()) as { error?: string; comment?: Detail["comments"][number] };
      if (!res.ok || !d.comment) {
        toast({ title: d.error || "Couldn't send — please try again.", variant: "destructive" });
        return;
      }
      setComment("");
      if (d.comment.crisisFlag) {
        setCommentCrisis(true);
      } else {
        toast({ title: "Your reply was shared. Thank you for walking with them." });
      }
      await load();
    } catch {
      toast({ title: "Network trouble — please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="font-display text-2xl">This post isn&apos;t available.</p>
        <p className="mt-2 text-sm text-muted-foreground">It may have been hidden while under review.</p>
        <Button asChild className="mt-6">
          <Link href="/community">Back to the community</Link>
        </Button>
      </div>
    );
  }

  if (!data) {
    return <PostDetailSkeleton />;
  }

  const { post, comments } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/community">
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden /> All posts
        </Link>
      </Button>

      <article className="fade-up">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-secondary-foreground">
                {CATEGORY_LABEL[post.category] ?? post.category}
              </span>
              <span>{fmtDate(post.createdAt)}</span>
              <span aria-hidden>·</span>
              <span>{post.authorName}</span>
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold leading-snug sm:text-3xl">{post.title}</h1>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{post.body}</p>

            {post.crisisFlag ? (
              <CrisisBanner
                className="mt-5"
                title={CRISIS_BANNER.title}
                body="This post mentions something serious. The person who wrote it is being shown crisis support resources — please keep them in prayer and reply with gentleness."
              />
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <ReactionButtons
                postId={post.id}
                sameSituation={post.sameSituation}
                encouraged={post.encouraged}
                myReactions={data.myReactions}
                onChange={(s) =>
                  setData((prev) => (prev ? { ...prev, post: { ...prev.post, sameSituation: s.sameSituation, encouraged: s.encouraged }, myReactions: s.myReactions } : prev))
                }
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReportCommentId(undefined);
                  setReportOpen(true);
                }}
                aria-label="Report this post"
              >
                <Flag className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </article>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="replies-heading">
          <h2 id="replies-heading" className="font-display text-xl font-semibold">
            Replies <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
          </h2>

          <div className="mt-4 space-y-3">
            {comments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No replies yet — your words could be the comfort they&apos;re praying for.
                </CardContent>
              </Card>
            ) : (
              comments.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {c.authorName}
                        {c.mine ? " (you)" : ""} · {fmtDate(c.createdAt)}
                      </span>
                      <button
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => {
                          setReportCommentId(c.id);
                          setReportOpen(true);
                        }}
                        aria-label="Report this reply"
                      >
                        <Flag className="h-3 w-3" aria-hidden /> Report
                      </button>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{c.body}</p>
                    {c.crisisFlag ? (
                      <p className="mt-2 rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
                        This reply mentions something serious — support resources were shared with its author.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <form onSubmit={sendComment} className="mt-5 rounded-xl border border-border bg-card p-4">
            <label htmlFor="comment-body" className="text-sm font-medium">
              Leave an anonymous reply
            </label>
            <Textarea
              id="comment-body"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Speak gently — you never know how heavy someone's week has been."
              className="mt-2"
            />
            {commentCrisis ? (
              <p className="mt-2 rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
                Your reply mentioned something serious — please look at the support note below and know that help is real and near.
              </p>
            ) : null}
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Replies are always anonymous.</p>
              <Button type="submit" disabled={sending || comment.trim().length < 2}>
                <Send className="mr-1.5 h-4 w-4" aria-hidden />
                {sending ? "Sending…" : "Reply"}
              </Button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <SimilarPosts postId={post.id} />
          <Card>
            <CardContent className="p-4 text-xs leading-relaxed text-muted-foreground">
              Every post and reply passes an automatic safety check, and members can report anything
              harmful — it is hidden after a few reports until a moderator reviews it.
            </CardContent>
          </Card>
        </aside>
      </div>

      <ReportDialog postId={post.id} commentId={reportCommentId} open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
}
