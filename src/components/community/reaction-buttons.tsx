"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HeartHandshake, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type Props = {
  postId: string;
  sameSituation: number;
  encouraged: number;
  myReactions: string[];
  onChange?: (state: { sameSituation: number; encouraged: number; myReactions: string[] }) => void;
};

export function ReactionButtons({ postId, sameSituation, encouraged, myReactions, onChange }: Props) {
  const [busy, setBusy] = useState(false);

  async function toggle(type: "SAME_SITUATION" | "ENCOURAGED") {
    if (busy) return;
    setBusy(true);
    // optimistic
    const had = myReactions.includes(type);
    onChange?.({
      sameSituation: sameSituation + (type === "SAME_SITUATION" ? (had ? -1 : 1) : 0),
      encouraged: encouraged + (type === "ENCOURAGED" ? (had ? -1 : 1) : 0),
      myReactions: had ? myReactions.filter((t) => t !== type) : [...myReactions, type],
    });
    try {
      const res = await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { active: boolean; sameSituation: number; encouraged: number };
      onChange?.({
        sameSituation: data.sameSituation,
        encouraged: data.encouraged,
        myReactions: had ? myReactions.filter((t) => t !== type) : [...myReactions, type],
      });
    } catch {
      toast({ title: "That didn't go through — please try again.", variant: "destructive" });
      onChange?.({
        sameSituation: sameSituation,
        encouraged: encouraged,
        myReactions: myReactions,
      });
    } finally {
      setBusy(false);
    }
  }

  const same = myReactions.includes("SAME_SITUATION");
  const enc = myReactions.includes("ENCOURAGED");

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Post reactions">
      <Button
        variant={same ? "default" : "outline"}
        size="sm"
        disabled={busy}
        onClick={() => toggle("SAME_SITUATION")}
        aria-pressed={same}
        aria-label={`I'm in the same situation — ${sameSituation} others`}
      >
        <HeartHandshake className="mr-1.5 h-4 w-4" aria-hidden />
        I&apos;m in the same situation · {sameSituation}
      </Button>
      <Button
        variant={enc ? "default" : "outline"}
        size="sm"
        disabled={busy}
        onClick={() => toggle("ENCOURAGED")}
        aria-pressed={enc}
        aria-label={`This encouraged me — ${encouraged} others`}
        className={cn(!enc && "border-gold/50 hover:bg-accent")}
      >
        <Sparkles className="mr-1.5 h-4 w-4" aria-hidden />
        This encouraged me · {encouraged}
      </Button>
    </div>
  );
}
