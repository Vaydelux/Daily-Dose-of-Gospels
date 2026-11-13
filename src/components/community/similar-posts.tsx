"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { SLine, SCircle } from "@/components/site/skeletons";
import { Users } from "lucide-react";

type Similar = {
  id: string;
  title: string;
  category: string;
  snippet: string;
  sameSituation: number;
  encouraged: number;
  similarity: number;
};

export function SimilarPosts({ postId }: { postId: string }) {
  const [similar, setSimilar] = useState<Similar[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/posts/${postId}/similar`)
      .then((r) => r.json())
      .then((d: { similar: Similar[] }) => {
        if (alive) setSimilar(d.similar);
      })
      .catch(() => alive && setSimilar([]));
    return () => {
      alive = false;
    };
  }, [postId]);

  return (
    <Card aria-labelledby="similar-heading" className="border-gold/40 bg-accent/40">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gold-foreground" aria-hidden />
          <h2 id="similar-heading" className="text-sm font-semibold uppercase tracking-widest text-gold-foreground">
            You are not alone
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Others here are walking through something similar. Their stories may encourage yours.
        </p>

        {similar === null ? (
          <div className="mt-4 space-y-3" aria-hidden>
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-card p-4">
                <SCircle className="h-10 w-10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <SLine className="h-3 w-1/3" />
                  <SLine className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : similar.length === 0 ? (
          <p className="mt-4 rounded-lg bg-card p-4 text-sm text-muted-foreground">
            No similar stories yet — yours might be the first. Whoever needs it will find it here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {similar.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/community/${s.id}`}
                  className="block rounded-lg bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <p className="line-clamp-1 text-sm font-semibold">{s.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{s.snippet}…</p>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {s.sameSituation + s.encouraged} hearts walked with this
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
