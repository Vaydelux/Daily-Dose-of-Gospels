# Daily Dose of Gospels

**dailydoseofgospels.com** — an anonymous Christian community forum with an AI-guided
counseling chat. Verse & Parable of the Day, a gentle forum, a Christ-centered AI
counselor that prays first, a room of original instrumental worship music, and an
online **Bible reader** that opens like the real thing — leather cover, gilded 3D
page-turns, red-letter words of Christ, read-aloud narration, and a four-layer
cache (memory → IndexedDB → prefetch → immutable CDN proxy) so pages turn instantly
and stay readable offline.

> “Come to me, all you who are weary and burdened, and I will give you rest.” — Matthew 11:28

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript, Tailwind CSS 4 + shadcn/ui |
| Database | Prisma ORM — SQLite in dev, PostgreSQL (Neon/Supabase) in production |
| AI | OpenAI `gpt-4o-mini` + `text-embedding-3-small` (server-side only). Falls back to the bundled sandbox SDK when no `OPENAI_API_KEY` is set |
| Vectors | Cosine similarity in app code (works on SQLite **and** Postgres); pgvector upgrade path documented below |
| Rate limiting | In-memory sliding window (Upstash-swappable interface in `src/lib/ratelimit.ts`) |
| Audio storage | Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set; `public/uploads` fallback in dev |
| Daily content | **No cron, no AI** — deterministic rotation over curated Scripture banks (`src/lib/daily.ts`, `src/lib/parables-bank.ts`) |

## Run locally

```bash
bun install
cp .env.example .env          # SQLite default works out of the box
bun run db:push               # create tables
bun prisma/seed.ts            # tracks + sample posts (idempotent)
bun run dev                   # http://localhost:3000
python3 scripts/generate_music.py   # optional: regenerate the 6 demo tracks
```

Everything runs with **zero API keys** — the AI falls back to the bundled SDK.
Set `OPENAI_API_KEY` to use the exact models from the spec (`gpt-4o-mini`,
`text-embedding-3-small`).

## Build & run

- `bun run build` — plain Next build (what Vercel runs).
- `bun run build:standalone` — build **and** stage `output: "standalone"`
  (copies `public/` + `.next/static` into `.next/standalone`). Used for the
  self-hosted server: `bun run start`.
- `output: "standalone"` is applied automatically everywhere **except** Vercel
  (`next.config.ts` checks `process.env.VERCEL`).

## Deploy to Vercel

The repo ships release-ready: `vercel.json` (security headers + immutable caching
for icons/covers/music), `.vercelignore` (dev scripts, local DB, and sandbox
artifacts never upload), and a plain `bun run build` that Vercel consumes as-is.

1. Push to GitHub and import into Vercel.
2. Create a Postgres database (Neon or Supabase) → set `DATABASE_URL`
   (change `provider` to `"postgresql"` in `prisma/schema.prisma`, then `bun run db:push`).
3. Add env vars from `.env.example`: `OPENAI_API_KEY`, `ADMIN_PASSWORD` (**change it**),
   `NEXT_PUBLIC_SITE_URL`, `BLOB_READ_WRITE_TOKEN` (create a Vercel Blob store).
4. First deploy: run the seed against production once (`DATABASE_URL=<prod> bun prisma/seed.ts`).

No cron is required: the Verse and Parable of the Day are pure code —
`getDailyContent()` rotates through curated Scripture by UTC date, so every
visitor on the same day sees the same real Bible passage.

## Theology guardrails (Sola Scriptura content policy)

> “You shall not add to the word which I command you.” — Deuteronomy 4:2

- **Parables come only from the Bible.** The Parable of the Day rotates through
  35 real parables (all of Jesus' major parables from Matthew/Mark/Luke, plus
  Nathan's ewe lamb and Isaiah's vineyard). Every word of the passage text was
  fetched verbatim from bible-api.com in the World English Bible (public
  domain) by `scripts/fetch_parables.mjs` — nothing is written by AI or by hand.
- **The AI counselor may not invent stories.** The system prompt forbids
  inventing parables/fables/visions, requires named citations for every story
  it retells (e.g. “the parable of the lost son, Luke 15:11–32”), and requires
  it to distinguish “Scripture says…” from its own words.
- **Reflections are clearly labeled commentary.** The verse reflection carries
  the label “A short reflection — our words, not His”.
- There is no AI generation step for daily content at all — the old cron route
  and `DailyContent` table were removed for exactly this reason.

## Architecture notes

### 100% anonymity
- Session = random opaque token in an HTTP-only cookie (minted in `src/middleware.ts`,
  edge-safe). Display name ("Faithful Sparrow 4821") is derived from the token hash.
- IPs are never stored; they are hashed in memory for rate limiting only.
- PII scrub (`src/lib/pii.ts`) runs **before** any post/comment/message is saved.
- "Clear my memory" (`DELETE /api/counsel/memory`) permanently deletes the counselor's
  long-term memory note.

### Prayer-first state machine (`src/app/api/counsel/chat/route.ts`)
- Conversation rows carry `stage`: `awaiting_prayer_choice` → `counseling`.
- New problems reset the stage (deterministic `looksLikeNewProblem` heuristic) so the
  counselor offers prayer again; prayer choice is matched deterministically
  (EN + Tagalog variants), not left to the model.
- **YES** → prayer is generated for their exact situation, then counsel is
  cache-aware: cache hit → short personalization prompt (cached counsel + memory);
  miss → one streamed call, whose counsel portion is stored in the semantic cache.
- **NO** → skip straight to counsel (same cache path).

### Token-saving cache (`src/lib/cache.ts`)
- Normalize (lowercase + PII strip) → embed → cosine search over `CachedResponse`
  → hit at similarity ≥ `CACHE_SIMILARITY_THRESHOLD` (default 0.92) with matching
  language → re-streamed cached counsel with a personalization pass.
- Quality score via thumbs up/down; low-quality entries are evicted; TTL 90 days.
- Stats (`cache_hit`, `cache_miss`, `tokens_saved`, `off_topic`, `crisis_detected`)
  are shown on `/admin`.

### Topic guard
- Tiny JSON classifier call (gpt-4o-mini via provider) labels `life_counsel` vs
  `off_topic`; off-topic messages get the kind redirect, are flagged in the DB, and
  after repeated attempts the session cools down for 10 minutes.
- Prompt-injection defenses: the system prompt instructs the model to ignore
  role-change/system-prompt-reveal instructions inside user content, and the
  classifier catches overt jailbreak attempts as `off_topic`.

### Crisis safety
- Regex detector (EN + Tagalog) for self-harm/abuse runs **before** anything else —
  in the counselor it streams the crisis resources message (NCMH 1553 / 911 /
  findahelpline.com) and never leaves the user with advice alone; in the forum it
  flags the post ("held with care") and shows the responder a gentle note.
- Every post/comment/message also passes AI moderation + deterministic hide-list;
  community reports auto-hide content at 3 reports (`AUTO_HIDE_REPORT_THRESHOLD`).

### Connection engine
- Post bodies are embedded on creation (`PostEmbedding`). Post pages ask
  `/api/posts/[id]/similar` for the top 3–5 similar posts → "You are not alone"
  sidebar.

### pgvector upgrade (PostgreSQL)
```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "PostEmbedding" ADD COLUMN embedding_vec vector(1536);
UPDATE "PostEmbedding" SET embedding_vec = embedding::vector;
CREATE INDEX ON "PostEmbedding" USING hnsw (embedding_vec vector_cosine_ops);
-- then swap the scan in src/app/api/posts/[id]/similar/route.ts for:
--   ORDER BY embedding_vec <=> $1 LIMIT 5
```
The app-code cosine fallback needs no changes and stays as a safety net.

## Project structure

```
prisma/schema.prisma        # all models: AnonSession, Post, Comment, Reaction, Report,
                            # PostEmbedding, Conversation, Message, MemoryNote,
                            # CachedResponse, Track, Playlist, PlaylistItem,
                            # ModerationLog, UsageStat
prisma/seed.ts              # tracks, sample posts, playlist
scripts/fetch_parables.mjs  # fetches real parable texts (WEB) → src/lib/parables-bank.ts
scripts/generate_music.py   # six original instrumentals
src/middleware.ts           # anonymous session cookie (edge-safe)
src/lib/
  ai/provider.ts            # OpenAI ⇄ sandbox SDK abstraction (chat, stream, embed)
  prompts.ts                # ALL prompts: system, classifier, prayer, moderation,
                            # summarizer, memory distiller (daily content needs none)
  parables-bank.ts          # 35 REAL Bible parables, verbatim WEB text (generated)
  daily.ts                  # Verse/Parable of the Day — deterministic Scripture rotation
  session.ts session-id.ts  # anonymous identity
  pii.ts ratelimit.ts       # scrubbing, limits, dedup, cooldowns
  moderation.ts crisis.ts   # safety layers + crisis copy
  cache.ts memory.ts        # semantic cache + rolling/long-term memory
  storage.ts admin-auth.ts  # blob storage, admin gate
  bible.ts                  # bible-api.com server integration (cached, fallback treasury)
  bible/books-meta.ts       # all 66 books + chapter counts (client-safe)
  bible/chapter-store.ts    # reader cache: memory Map → IndexedDB → network, prefetch
  bible/red-letter.ts       # static ranges of the words of Christ (KJV numbering)
src/app/                    # / , /community, /community/[id], /verses, /bible,
                            # /counsel, /music, /admin, /privacy, /terms + all API routes
src/app/api/bible/*         # cached proxies: chapter, passage, books, translations, random
src/components/bible/       # reader shell, book spread (3D turn), narration hook
src/components/site/        # header, footer, reveal, ambient backdrop, perf probe…
src/components/             # home/, community/, music/, ui/
```

## Testing checklist

**Prayer-first flow**
- [ ] Open `/counsel`, send a new problem → reply is 1–2 empathetic sentences +
      "would you like us to pray over this together?" with chips `[Yes, let's pray]` `[Not now]`.
- [ ] Tap **Not now** → no prayer, straight counsel (empathy → Scripture with a real
      reference → plain meaning → gentle options → "This is yours to decide…").
- [ ] Counselor never invents stories: every story it retells carries a real
      Bible reference; nothing is presented as a new "parable".
- [ ] Send another new problem → prayer offer returns.
- [ ] Tap **Yes, let's pray** → specific prayer ending in "Amen", then counsel.
- [ ] Follow-up messages on the same problem → no re-asking about prayer.

**Off-topic blocking**
- [ ] Ask the counselor to write code / homework → kind redirect, message flagged.
- [ ] Repeat 3× → cooldown reply for ~10 minutes.

**Cache hit / miss**
- [ ] Ask problem A, decline prayer (stores counsel). Fresh session (clear cookies),
      repeat problem A verbatim, decline prayer → admin shows `cache_hit +1`,
      response is the cached counsel personalized with memory ("I remember the last time…").
- [ ] `/admin` → "Semantic cache" tab lists entries with language, hits, quality.

**Memory**
- [ ] After a conversation, `/counsel` shows "Welcome back — I remember…".
- [ ] "Clear my memory" → confirm → the line disappears and never returns.

**Anonymity**
- [ ] Post in `/community` → author shows a generated name, never anything you typed.
- [ ] Include an email/phone in a post → stored text shows `[private]`.
- [ ] DB contains no emails/IPs (`sqlite3 db/custom.db`).

**Similarity matching**
- [ ] Create a post about grief → open a second grief post → "You are not alone"
      sidebar lists it; unrelated posts do not cross-match.

**Scripture-only content**
- [ ] `/` Parable of the Day shows a real Bible passage with reference
      (e.g. "The Lost Son — Luke 15:11–32"), the verbatim text, and a
      BibleGateway link; the label says "Straight from the Bible".
- [ ] `/api/daily-content` returns the same passage for everyone on the same
      UTC date, and changes on the next date.
- [ ] Verse reflection sits under the label "A short reflection — our words, not His".

**Reactions & moderation**
- [ ] "I'm in the same situation" / "This encouraged me" toggle with counts.
- [ ] Report 3× (different sessions or 3 report rows) → post auto-hides;
      `/admin` (password from `ADMIN_PASSWORD`) shows it in the review queue with
      Restore/Hide.

**Music**
- [ ] `/music` lists tracks by album; play → persistent bottom mini-player survives
      navigation; next/prev/seek/volume work; play count increments (1 per minute).
- [ ] Admin → "Add track" uploads audio + cover and publishes.

**Bible reader (`/bible`)**
- [ ] Landing shows the leather cover; opening it fans the book open (lite devices get a quiet fade).
- [ ] Page turns: arrow keys, edge chevrons, and the pager — 3D leaf on desktop, fades in lite mode.
- [ ] Search "John 3:16" lands on the chapter with the verse gilded; "Psalm 23" opens the chapter.
- [ ] Translation switch (KJV default), Surprise me, book/chapter pickers all resolve through the proxy.
- [ ] Red-letter: in the Gospels, Jesus' words render in deep red; the toolbar toggle persists.
- [ ] Listen → narration reads the chapter; finishing hands off into the next chapter; Pause/Resume/Stop + rate work.
- [ ] Revisit `/` → the "Continue reading" ribbon shows the last chapter with a journey meter and deep-links back.
- [ ] Offline resilience: previously visited chapters still open with the network blocked (IndexedDB shelf).
- [ ] Network panel: revisiting a chapter makes **no** new `/api/bible/*` calls (memory/IDB hit); neighbours prefetch ~1.2s after a chapter lands.

**Performance probe**
- [ ] First visit samples ~2s of rAF (once per session, after load); a stuttering device
      sets `ddog.perf.lite.v1`, freezes ambient motion (`html[data-perf="lite"]`), and the
      reader drops to lite pages mid-session — a manual Gilded/Lite pick still wins.

## Key decisions & deviations

- **SQLite in dev, Postgres-ready schema.** `Json`-typed fields are avoided (Prisma +
  SQLite limitation) — JSON strings instead — so the switch to Neon/Supabase is a
  one-line provider change plus `db:push`.
- **Cosine similarity in app code** as the default vector path (spec-sanctioned
  fallback), with the pgvector upgrade above.
- **AI provider abstraction**: the spec's OpenAI stack is the production path; the
  bundled sandbox SDK keeps the app fully functional without keys.
- **Local hash embeddings** (256-dim, deterministic) when no embedding API is
  configured — the semantic cache and connection engine still work in dev. Embeddings
  record their model so different models are never compared.
- **Demo music** is generated by `scripts/generate_music.py` (original synthesis), so
  the player, play counts, and admin upload are verifiable end-to-end before the
  owner uploads real compositions.
