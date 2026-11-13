"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CrisisBanner } from "@/components/community/crisis-banner";
import { POST_CATEGORIES, type PostCategory } from "@/lib/validators";

const LABELS: Record<PostCategory, string> = {
  TESTIMONY: "Testimony — what God has done",
  PRAYER: "Prayer Request",
  STRUGGLES: "Struggles",
  ENCOURAGEMENT: "Encouragement",
  REFLECTION: "Bible Reflection",
};

export function PostForm({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [category, setCategory] = useState<PostCategory>("TESTIMONY");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<{ title: string; body: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, body }),
      });
      const data = (await res.json()) as {
        error?: string;
        post?: { id: string; crisisFlag: boolean; hidden: boolean };
        crisis?: { title: string; body: string } | null;
      };
      if (!res.ok) {
        setError(data.error || "Something went wrong — please try again.");
        return;
      }
      if (data.crisis) {
        setCrisis(data.crisis);
        return;
      }
      setOpen(false);
      setTitle("");
      setBody("");
      router.push(`/community/${data.post!.id}`);
      router.refresh();
    } catch {
      setError("Network trouble — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setCrisis(null);
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-lg">
        {crisis ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Your post was shared — and we want to make sure you&apos;re safe.</DialogTitle>
            </DialogHeader>
            <CrisisBanner title={crisis.title} body={crisis.body} />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); router.push("/community"); }}>
                I understand
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display">Share with the community</DialogTitle>
              <DialogDescription>
                Completely anonymous. Please don&apos;t include names, contact details, or links —
                they are removed automatically to protect you.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label htmlFor="post-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as PostCategory)}>
                <SelectTrigger id="post-category" aria-label="Post category">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {POST_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="post-title">Title</Label>
              <Input
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="A short, honest headline"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="post-body">What&apos;s on your heart?</Label>
              <Textarea
                id="post-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={4000}
                rows={6}
                placeholder="Share as much or as little as you like…"
                required
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting || title.trim().length < 4 || body.trim().length < 10}>
                {submitting ? "Sharing…" : "Share anonymously"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
