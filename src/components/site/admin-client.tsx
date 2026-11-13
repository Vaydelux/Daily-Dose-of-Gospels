"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SLine, LoadingBanner } from "@/components/site/skeletons";
import { Lock, LogOut, RefreshCw } from "lucide-react";

type AdminData = {
  backend: { ai: string; chatModel: string; embeddingModel: string };
  stats: Record<string, number>;
  counts: { posts: number; comments: number; conversations: number; tracks: number };
  hiddenPosts: Array<{
    id: string; title: string; category: string; hidden: boolean;
    crisisFlag: boolean; reportCount: number; reports: number; createdAt: string;
  }>;
  flaggedComments: Array<{ id: string; postId: string; body: string; hidden: boolean; reportCount: number; createdAt: string }>;
  moderationLog: Array<{ id: string; targetType: string; targetId: string; action: string; reason: string; createdAt: string }>;
  cacheRows: Array<{ id: string; normalized: string; language: string; hits: number; qualityScore: number; votes: number; createdAt: string }>;
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function AdminClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/data");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      setAuthed(true);
      setData((await res.json()) as AdminData);
    } catch {
      setError("Could not load admin data.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setError(d.error || "Incorrect password");
        return;
      }
      setPassword("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setData(null);
  }

  async function toggleHidden(targetType: "post" | "comment", targetId: string, hidden: boolean) {
    await fetch("/api/admin/hide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, hidden }),
    });
    await load();
  }

  if (authed === null || (authed && busy && !data)) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-10" aria-busy="true">
        <SLine className="h-10 w-48" />
        <div className="flex justify-center py-2">
          <LoadingBanner label="Opening the ledger" />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <SLine className="h-3 w-20" />
              <SLine className="mt-3 h-7 w-14" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <SLine className="h-4 w-32" />
          <div className="mt-4 space-y-3">
            <SLine className="h-3 w-full" />
            <SLine className="h-3 w-11/12" />
            <SLine className="h-3 w-9/12" />
            <SLine className="h-3 w-10/12" />
          </div>
        </div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center px-4 pb-24 pt-24">
        <Card className="w-full">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" aria-hidden />
              <h1 className="font-display text-xl font-semibold">Moderator sign-in</h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the admin password (set in ADMIN_PASSWORD).
            </p>
            <form onSubmit={login} className="mt-4 space-y-3">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                aria-label="Admin password"
                required
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cacheHits = data?.stats.cache_hit ?? 0;
  const cacheMisses = data?.stats.cache_miss ?? 0;
  const hitRate = cacheHits + cacheMisses > 0 ? Math.round((cacheHits / (cacheHits + cacheMisses)) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-8">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Admin</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={busy}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Sign out
          </Button>
        </div>
      </header>

      {data ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            AI backend: <Badge variant="secondary">{data.backend.ai}</Badge> · chat: {data.backend.chatModel} · embeddings: {data.backend.embeddingModel}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Visible posts" value={data.counts.posts} />
            <Stat label="Visible comments" value={data.counts.comments} />
            <Stat label="Counselor conversations" value={data.counts.conversations} />
            <Stat label="Cache hit rate" value={`${hitRate}%`} />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Tokens saved (est.)" value={(data.stats.tokens_saved ?? 0).toLocaleString()} />
            <Stat label="Off-topic blocked" value={data.stats.off_topic ?? 0} />
            <Stat label="Crisis detections" value={data.stats.crisis_detected ?? 0} />
            <Stat label="Tracks" value={data.counts.tracks} />
          </div>

          <Tabs defaultValue="queue" className="mt-8">
            <TabsList>
              <TabsTrigger value="queue">Review queue</TabsTrigger>
              <TabsTrigger value="cache">Semantic cache</TabsTrigger>
              <TabsTrigger value="log">Moderation log</TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="mt-4 space-y-3">
              {data.hiddenPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing needs review right now.</p>
              ) : (
                data.hiddenPosts.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.category} · {p.reportCount} report{p.reportCount === 1 ? "" : "s"} · {new Date(p.createdAt).toLocaleString()}
                        </p>
                        <div className="mt-1 flex gap-1.5">
                          {p.hidden ? <Badge variant="destructive">hidden</Badge> : <Badge variant="secondary">visible</Badge>}
                          {p.crisisFlag ? <Badge className="border-gold/60 text-gold-foreground" variant="outline">crisis</Badge> : null}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => void toggleHidden("post", p.id, false)} disabled={!p.hidden}>
                          Restore
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => void toggleHidden("post", p.id, true)} disabled={p.hidden}>
                          Hide
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              {data.flaggedComments.length > 0 ? (
                <>
                  <h2 className="pt-4 font-display text-lg font-semibold">Flagged comments</h2>
                  {data.flaggedComments.map((c) => (
                    <Card key={c.id}>
                      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{c.body}</p>
                          <p className="text-xs text-muted-foreground">{c.reportCount} reports · {new Date(c.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => void toggleHidden("comment", c.id, false)} disabled={!c.hidden}>Restore</Button>
                          <Button size="sm" variant="destructive" onClick={() => void toggleHidden("comment", c.id, true)} disabled={c.hidden}>Hide</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="cache" className="mt-4">
              {data.cacheRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">The cache fills as counseling conversations unfold.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="p-3">Normalized question</th>
                        <th className="p-3">Lang</th>
                        <th className="p-3">Hits</th>
                        <th className="p-3">Quality</th>
                        <th className="p-3">Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cacheRows.map((r) => (
                        <tr key={r.id} className="border-t border-border/70">
                          <td className="max-w-[320px] truncate p-3">{r.normalized}</td>
                          <td className="p-3">{r.language}</td>
                          <td className="p-3">{r.hits}</td>
                          <td className="p-3">{r.qualityScore.toFixed(1)} ({r.votes})</td>
                          <td className="p-3 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="log" className="mt-4">
              {data.moderationLog.length === 0 ? (
                <p className="text-sm text-muted-foreground">No moderation activity yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.moderationLog.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3 text-sm">
                      <Badge variant={m.action === "allow" ? "secondary" : m.action === "crisis" ? "outline" : "destructive"}>{m.action}</Badge>
                      <span className="text-xs text-muted-foreground">{m.targetType}</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{m.reason || "—"}</span>
                      <span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
