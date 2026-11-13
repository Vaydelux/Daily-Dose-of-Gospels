"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const REASONS = [
  "Unkind or attacking language",
  "Spam or solicitation",
  "Sexual or graphic content",
  "Sharing someone's private information",
  "Other",
];

export function ReportDialog({
  postId,
  commentId,
  open,
  onOpenChange,
}: {
  postId: string;
  commentId?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [reason, setReason] = useState(REASONS[0]);
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    try {
      const full = extra.trim() ? `${reason} — ${extra.trim()}` : reason;
      const res = await fetch(`/api/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: full, commentId }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      setDone(data.message || data.error || "Thank you.");
    } catch {
      setDone("Network trouble — please try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setDone(null);
          setExtra("");
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {done ? (
          <>
            <DialogHeader>
              <DialogTitle>Report received</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{done}</p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Report this {commentId ? "reply" : "post"}</DialogTitle>
              <DialogDescription>
                Thank you for helping keep this a safe, gentle place. Reports are anonymous.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div role="radiogroup" aria-label="Report reason" className="space-y-2">
                {REASONS.map((r) => (
                  <label key={r} className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm has-[[data-state=checked]]:border-gold has-[[data-state=checked]]:bg-accent/60">
                    <input
                      type="radio"
                      name="report-reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="accent-[color:var(--gold)]"
                    />
                    {r}
                  </label>
                ))}
              </div>
              <Textarea
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="Anything else the moderators should know? (optional)"
                rows={3}
                maxLength={280}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={submit} disabled={busy}>{busy ? "Sending…" : "Send report"}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
