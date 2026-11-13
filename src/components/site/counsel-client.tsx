"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { BookmarkCheck, BookOpen, Info, Loader2, Send, Sparkles, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFavorites, saveFavorite } from "@/lib/favorites-store";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  quickReplies?: string[];
  cacheHit?: boolean;
  cachedResponseId?: string | null;
};

const GREETING: Msg = {
  id: "greeting",
  role: "assistant",
  content:
    "Peace be with you. I'm here to walk with you through whatever you're carrying — worries, grief, decisions, faith, family, work. Take your time; share whatever is on your heart.",
};

const SCRIPTURE_RX =
  /\b((?:[1-3]\s)?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Songs?|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Mica[h]|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s\d{1,3}:\d{1,3}(?:[-–]\d{1,3})?)/g;

function extractScripture(text: string): string[] {
  const matches = text.match(SCRIPTURE_RX) ?? [];
  return Array.from(new Set(matches.map((m) => m.replace(/\s+/g, " ").trim()))).slice(0, 4);
}

export function CounselClient() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [stage, setStage] = useState<"idle" | "awaiting_prayer_choice" | "counseling">("idle");
  const [memoryRendered, setMemoryRendered] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const [rated, setRated] = useState<Record<string, 1 | -1>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const [favorites] = useFavorites();

  useEffect(() => {
    fetch("/api/counsel/memory")
      .then((r) => r.json())
      .then((d: { rendered?: string }) => setMemoryRendered(d.rendered ?? ""))
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;
      setInput("");
      setStreaming(true);

      const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content: trimmed };
      const aiMsg: Msg = { id: `a-${Date.now()}`, role: "assistant", content: "", streaming: true };
      setMessages((prev) => [...prev, userMsg, aiMsg]);

      try {
        const res = await fetch("/api/counsel/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });

        if (!res.ok || !res.body) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsg.id
                ? { ...m, content: d.error || "Something went wrong — please try again in a moment.", streaming: false }
                : m
            )
          );
          setStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let acc = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            try {
              const ev = JSON.parse(line.slice(5).trim()) as {
                type: string; text?: string; error?: string;
                stage?: "awaiting_prayer_choice" | "counseling";
                quickReplies?: string[]; cacheHit?: boolean; cachedResponseId?: string | null;
              };
              if (ev.type === "delta" && ev.text) {
                acc += ev.text;
                setMessages((prev) =>
                  prev.map((m) => (m.id === aiMsg.id ? { ...m, content: acc } : m))
                );
              } else if (ev.type === "done") {
                if (ev.stage) setStage(ev.stage);
                if (ev.cacheHit && ev.cachedResponseId) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsg.id ? { ...m, cacheHit: true, cachedResponseId: ev.cachedResponseId } : m
                    )
                  );
                }
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsg.id
                      ? { ...m, streaming: false, quickReplies: ev.quickReplies ?? [] }
                      : m
                  )
                );
              } else if (ev.type === "error") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsg.id ? { ...m, content: ev.error || "Error", streaming: false } : m
                  )
                );
              }
            } catch {
              // skip malformed event
            }
          }
        }
        setMessages((prev) => prev.map((m) => (m.id === aiMsg.id ? { ...m, streaming: false } : m)));
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsg.id
              ? { ...m, content: "The connection dropped — please send that again.", streaming: false }
              : m
          )
        );
      } finally {
        setStreaming(false);
      }
    },
    [streaming]
  );

  function saveVerse(verseRef: string) {
    saveFavorite(verseRef);
    toast({ title: `Saved ${verseRef} — find it under Verses → My favorites.` });
  }

  function rate(id: string, vote: 1 | -1) {
    setRated((prev) => ({ ...prev, [id]: vote }));
    void fetch("/api/counsel/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cachedResponseId: id, vote }),
    }).catch(() => {});
    toast({ title: vote === 1 ? "Thank you — glad it helped." : "Thank you — this helps us care better." });
  }

  async function clearMemory() {
    setClearOpen(false);
    await fetch("/api/counsel/memory", { method: "DELETE" }).catch(() => {});
    setMemoryRendered("");
    toast({ title: "Your memory has been cleared — permanently." });
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const chips = streaming ? [] : lastAssistant?.quickReplies ?? (stage === "awaiting_prayer_choice" ? ["Yes, let's pray", "Not now"] : []);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-36 pt-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Talk to the Counselor</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Anonymous · Christ-centered · offers counsel, the decision is always yours
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setClearOpen(true)} aria-label="Clear my memory">
          <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Clear my memory
        </Button>
      </header>

      <div className="mt-2 flex items-start gap-2 rounded-lg bg-accent/60 px-3 py-2 text-xs leading-relaxed text-accent-foreground" role="note">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <p>
          This is AI-assisted spiritual encouragement, not professional counseling.
          If you are in danger or crisis, please contact local emergency services first.
        </p>
      </div>

      {memoryRendered ? (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          <Sparkles className="mr-1 inline h-3 w-3" aria-hidden />
          Welcome back — I remember walking with you through: {memoryRendered}
        </p>
      ) : null}

      {/* Messages */}
      <div ref={scrollRef} className="slim-scroll mt-4 h-[calc(100vh-24rem)] min-h-[260px] space-y-4 overflow-y-auto rounded-xl bg-secondary/30 p-4" aria-live="polite" aria-label="Conversation with the counselor">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={m.role === "user" ? "bubble-user" : "bubble-ai"}>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p>
              {m.streaming && m.content === "" ? (
                <span className="flex items-center gap-3 py-1" aria-label="Counselor is typing">
                  <span className="flex gap-1">
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </span>
                  <span className="shimmer h-2 w-24 rounded-full" aria-hidden />
                  <span className="shimmer h-2 w-14 rounded-full" aria-hidden />
                </span>
              ) : null}

              {!m.streaming && m.role === "assistant" && m.content ? (
                <div className="mt-3 space-y-2">
                  {(() => {
                    const refs = extractScripture(m.content);
                    if (refs.length === 0) return null;
                    return (
                      <div className="rounded-lg border border-gold/40 bg-background/60 p-3" role="region" aria-label="Scripture references">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gold-foreground">
                          <BookOpen className="h-3 w-3" aria-hidden /> Scripture in this reply
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {refs.map((ref) => {
                            const saved = favorites.includes(ref);
                            return (
                              <button
                                key={ref}
                                onClick={() => saveVerse(ref)}
                                className="inline-flex items-center gap-1 rounded-full border border-gold/50 px-2.5 py-1 text-xs font-medium hover:bg-accent"
                                aria-label={`Save ${ref} to favorites`}
                              >
                                {saved ? <BookmarkCheck className="h-3 w-3" aria-hidden /> : <BookmarkCheck className="h-3 w-3 opacity-50" aria-hidden />}
                                {ref}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {m.cacheHit && m.cachedResponseId ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Did this speak to you?</span>
                      <button
                        onClick={() => rate(m.cachedResponseId!, 1)}
                        disabled={rated[m.cachedResponseId!] !== undefined}
                        className="rounded-full border border-border p-1.5 hover:bg-accent disabled:opacity-40"
                        aria-label="This helped"
                      >
                        <ThumbsUp className="h-3 w-3" aria-hidden />
                      </button>
                      <button
                        onClick={() => rate(m.cachedResponseId!, -1)}
                        disabled={rated[m.cachedResponseId!] !== undefined}
                        className="rounded-full border border-border p-1.5 hover:bg-accent disabled:opacity-40"
                        aria-label="This did not help"
                      >
                        <ThumbsDown className="h-3 w-3" aria-hidden />
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Quick replies */}
      {chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Quick replies">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => void send(chip)}
              className="rounded-full border border-gold/60 bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-gold hover:text-gold-foreground"
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}

      {/* Composer */}
      <form
        className="mt-3 flex items-end gap-2 rounded-xl border border-border bg-card p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={2}
          maxLength={3000}
          placeholder="What's on your heart tonight?"
          aria-label="Your message"
          className="min-h-[52px] flex-1 resize-none border-0 bg-transparent focus-visible:ring-0"
        />
        <Button type="submit" size="icon" disabled={streaming || input.trim().length === 0} aria-label="Send message">
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        </Button>
      </form>

      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        You never have to share your name. Nothing here is linked to you.
      </p>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear my memory?</DialogTitle>
            <DialogDescription>
              This permanently deletes everything the counselor remembers about our conversations —
              themes, concerns, whether we prayed together. Your chats on this device stay; only the
              long-term memory goes. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClearOpen(false)}>Keep it</Button>
            <Button variant="destructive" onClick={() => void clearMemory()}>Yes, clear my memory</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
