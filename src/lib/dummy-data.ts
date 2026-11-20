/**
 * Curated dummy data for local development (in-memory fallback when no
 * DATABASE_URL is configured) and for seeding PostgreSQL (`prisma/seed.ts`).
 *
 * All Scripture references are real; all stories/posts are grounded,
 * reverent sample entries fitting the community categories.
 */

export interface DummySessionSeed {
  id: string;
  displayName: string;
}

export interface DummyTrackSeed {
  id: string;
  title: string;
  album: string;
  audioUrl: string;
  coverUrl: string;
  durationSec: number;
  playCount: number;
  scripture: string;
  description: string;
  lyrics: string;
}

export interface DummyCommentSeed {
  id: string;
  sessionId: string;
  body: string;
  hoursAgo: number;
}

export interface DummyPostSeed {
  id: string;
  sessionId: string;
  category: "TESTIMONY" | "PRAYER" | "STRUGGLES" | "ENCOURAGEMENT" | "REFLECTION";
  title: string;
  body: string;
  sameSituation: number;
  encouraged: number;
  crisisFlag?: boolean;
  hidden?: boolean;
  hoursAgo: number;
  comments: DummyCommentSeed[];
}

export interface DummyCachedResponseSeed {
  id: string;
  normalized: string;
  response: string;
  language: string;
  themeTags: string[];
  hits: number;
  qualityScore: number;
  votes: number;
}

export const DUMMY_SESSIONS: DummySessionSeed[] = [
  { id: "seed-faithful-sparrow", displayName: "Faithful Sparrow 4821" },
  { id: "seed-gentle-shepherd", displayName: "Gentle Shepherd 1042" },
  { id: "seed-quiet-lantern", displayName: "Quiet Lantern 7390" },
  { id: "seed-hopeful-cedar", displayName: "Hopeful Cedar 3158" },
  { id: "seed-patient-pilgrim", displayName: "Patient Pilgrim 6614" },
  { id: "seed-serene-olive", displayName: "Serene Olive 2905" },
];

export const DUMMY_PLAYLIST = {
  id: "seed-playlist-gentle-hours",
  name: "Gentle Hours · Vol. 1",
  description: "Six original instrumentals for prayer and rest.",
};

export const DUMMY_TRACKS: DummyTrackSeed[] = [
  {
    id: "seed-track-morning",
    title: "Morning Has Spoken",
    album: "Gentle Hours · Vol. 1",
    audioUrl: "/music/morning-has-spoken.mp3",
    coverUrl: "/covers/morning-has-spoken.svg",
    durationSec: 35,
    playCount: 142,
    scripture: "Psalm 5:3",
    description: "A gentle awakening in C major — for the first quiet minutes with coffee and Scripture.",
    lyrics: "Morning breaks without our help;\nmercy arrived before the light.\nSit still. The day is already held.\n\n(Instrumental)",
  },
  {
    id: "seed-track-still-waters",
    title: "Still Waters",
    album: "Gentle Hours · Vol. 1",
    audioUrl: "/music/still-waters.mp3",
    coverUrl: "/covers/still-waters.svg",
    durationSec: 51,
    playCount: 198,
    scripture: "Psalm 23:2",
    description: "Long, breathing pads in A minor — for when the soul needs leading beside quiet waters.",
    lyrics: "He makes me lie down\nwhere the water does not rush.\nRest is a place, not a reward.\n\n(Instrumental)",
  },
  {
    id: "seed-track-shepherds-path",
    title: "The Shepherd's Path",
    album: "Gentle Hours · Vol. 1",
    audioUrl: "/music/the-shepherds-path.mp3",
    coverUrl: "/covers/the-shepherds-path.svg",
    durationSec: 35,
    playCount: 115,
    scripture: "John 10:14",
    description: "An arpeggio lullaby in G major — the felt pace of following a Good Shepherd.",
    lyrics: "One step, then the next,\nand the path knows the way home.\n\n(Instrumental)",
  },
  {
    id: "seed-track-light-window",
    title: "Light Through the Window",
    album: "Gentle Hours · Vol. 1",
    audioUrl: "/music/light-through-the-window.mp3",
    coverUrl: "/covers/light-through-the-window.svg",
    durationSec: 39,
    playCount: 89,
    scripture: "Matthew 5:16",
    description: "Bell-like tones in F major — afternoon light landing on a kitchen table.",
    lyrics: "A lamp does not argue with the dark;\nit simply burns.\n\n(Instrumental)",
  },
  {
    id: "seed-track-anchor-deep",
    title: "Anchor in the Deep",
    album: "Gentle Hours · Vol. 1",
    audioUrl: "/music/anchor-in-the-deep.mp3",
    coverUrl: "/covers/anchor-in-the-deep.svg",
    durationSec: 47,
    playCount: 164,
    scripture: "Hebrews 6:19",
    description: "Contemplative drones in D minor — hope as an anchor for the soul, firm and secure.",
    lyrics: "The storm is loud;\nthe anchoring is quiet.\n\n(Instrumental)",
  },
  {
    id: "seed-track-harvest-peace",
    title: "Harvest of Peace",
    album: "Gentle Hours · Vol. 1",
    audioUrl: "/music/harvest-of-peace.mp3",
    coverUrl: "/covers/harvest-of-peace.svg",
    durationSec: 39,
    playCount: 97,
    scripture: "Philippians 4:7",
    description: "Bell arpeggios in E major — the peace that arrives after the work is surrendered.",
    lyrics: "What was planted in tears\nis gathered in quiet joy.\n\n(Instrumental)",
  },
];

export const DUMMY_POSTS: DummyPostSeed[] = [
  {
    id: "seed-post-1",
    sessionId: "seed-faithful-sparrow",
    category: "TESTIMONY",
    title: "Twelve years of anxiety, and last week something shifted",
    body: "I want to write this down before the feeling fades. For twelve years I carried a constant hum of anxiety — the kind that sits in your chest during ordinary moments. Last week my small group prayed over me, and I finally opened Philippians 4 like it was written for me. Nothing in my life is fixed. Everything in my chest is lighter. If you are in year twelve of your own waiting: God is not done.",
    sameSituation: 14,
    encouraged: 31,
    hoursAgo: 4,
    comments: [
      {
        id: "seed-comment-1a",
        sessionId: "seed-gentle-shepherd",
        body: "This made me tear up. Thank you for the hope.",
        hoursAgo: 3,
      },
      {
        id: "seed-comment-1b",
        sessionId: "seed-quiet-lantern",
        body: "Philippians 4:6-7 carried me through nursing school. Praying for your continued peace.",
        hoursAgo: 2,
      },
    ],
  },
  {
    id: "seed-post-2",
    sessionId: "seed-gentle-shepherd",
    category: "PRAYER",
    title: "Prayers for my father in the hospital",
    body: "He went in for what was supposed to be a routine surgery and there were complications. I am far away and cannot be there this week. If anyone here could lift him up — and my mother, who is sitting alone in that hallway — I would be grateful.",
    sameSituation: 9,
    encouraged: 22,
    hoursAgo: 9,
    comments: [
      {
        id: "seed-comment-2a",
        sessionId: "seed-hopeful-cedar",
        body: "Praying for your father tonight, and for your mother's strength.",
        hoursAgo: 8,
      },
      {
        id: "seed-comment-2b",
        sessionId: "seed-patient-pilgrim",
        body: "Sitting with you in this. Psalm 121 — He neither slumbers nor sleeps.",
        hoursAgo: 6,
      },
    ],
  },
  {
    id: "seed-post-3",
    sessionId: "seed-quiet-lantern",
    category: "STRUGGLES",
    title: "Does anyone else feel far from God even at church?",
    body: "I show up every Sunday. I sing the songs. But it has felt like talking into the ceiling for months now. I keep going because I hope, but I am tired of pretending it is fine in the lobby. Just wondering if I am the only one.",
    sameSituation: 27,
    encouraged: 18,
    hoursAgo: 15,
    comments: [
      {
        id: "seed-comment-3a",
        sessionId: "seed-serene-olive",
        body: "You are not the only one. I walked two years of that silence — it broke the week I finally said it out loud to a friend.",
        hoursAgo: 13,
      },
      {
        id: "seed-comment-3b",
        sessionId: "seed-faithful-sparrow",
        body: "The feeling of distance is not the fact of it. He is nearer than the ceiling.",
        hoursAgo: 11,
      },
    ],
  },
  {
    id: "seed-post-4",
    sessionId: "seed-hopeful-cedar",
    category: "ENCOURAGEMENT",
    title: "A small thing that helped me forgive",
    body: "I wrote the person's name on a rock and kept it in my pocket. Every time I felt the anger rise, I held the rock and prayed once for them instead of rehearsing the wound. After a month I left the rock at the beach. The anger washed out with the tide. Maybe it helps someone here.",
    sameSituation: 11,
    encouraged: 40,
    hoursAgo: 22,
    comments: [
      {
        id: "seed-comment-4a",
        sessionId: "seed-patient-pilgrim",
        body: "Trying this. Day one.",
        hoursAgo: 20,
      },
      {
        id: "seed-comment-4b",
        sessionId: "seed-gentle-shepherd",
        body: "The rock image is going to stay with me — thank you.",
        hoursAgo: 18,
      },
    ],
  },
  {
    id: "seed-post-5",
    sessionId: "seed-patient-pilgrim",
    category: "REFLECTION",
    title: "What Ezekiel 37 said to me about my burned-out soul",
    body: "Dry bones in a valley — not sick bones, not tired bones: dry. I have been reading my Bible like a duty and wondering why nothing breathes. Ezekiel does not resurrect the bones by trying harder. The prophet speaks the word over what cannot fix itself. Maybe the first prayer of my autumn is simply: breathe on me.",
    sameSituation: 8,
    encouraged: 15,
    hoursAgo: 31,
    comments: [
      {
        id: "seed-comment-5a",
        sessionId: "seed-quiet-lantern",
        body: "'The first prayer of my autumn is simply: breathe on me' — writing that down.",
        hoursAgo: 28,
      },
    ],
  },
  {
    id: "seed-post-6",
    sessionId: "seed-serene-olive",
    category: "PRAYER",
    title: "Starting over at 45",
    body: "Lost my job last month. Resume feels old, savings feel thin, and the interviews keep ending the same way. Trying to believe Psalm 23 is still true in a season that feels like subtraction. If you have walked through this, how did you keep praying when the answers were slow?",
    sameSituation: 16,
    encouraged: 12,
    hoursAgo: 40,
    comments: [
      {
        id: "seed-comment-6a",
        sessionId: "seed-hopeful-cedar",
        body: "Walked this at 39. The slowness was not absence. Provision came sideways and late and exactly enough.",
        hoursAgo: 37,
      },
      {
        id: "seed-comment-6b",
        sessionId: "seed-faithful-sparrow",
        body: "Praying for open doors — and for rest in the waiting.",
        hoursAgo: 35,
      },
    ],
  },
  {
    id: "seed-post-7",
    sessionId: "seed-faithful-sparrow",
    category: "TESTIMONY",
    title: "Reconciled with my brother after six quiet years",
    body: "We had not spoken since our mother's funeral. Pride on both sides, old words neither of us knew how to un-say. Last Tuesday I sent a three-line text asking if we could get coffee and start from zero. He replied in four minutes. We sat for two hours and neither of us kept score. Grace is real and it still surprises me.",
    sameSituation: 6,
    encouraged: 29,
    hoursAgo: 52,
    comments: [
      {
        id: "seed-comment-7a",
        sessionId: "seed-serene-olive",
        body: "Praise God. Three lines of humility can open a door six years of silence could not.",
        hoursAgo: 49,
      },
    ],
  },
  {
    id: "seed-post-8",
    sessionId: "seed-gentle-shepherd",
    category: "STRUGGLES",
    title: "Waking up at 3 AM with worry about my kids",
    body: "Every night around 3 AM my mind runs through every worst-case scenario for my children's future. I know Matthew 6 says not to worry about tomorrow, yet my chest tightens anyway. How do you hand your children back to God in the middle of the night?",
    sameSituation: 19,
    encouraged: 14,
    hoursAgo: 64,
    comments: [
      {
        id: "seed-comment-8a",
        sessionId: "seed-quiet-lantern",
        body: "I whisper their names one by one and say, 'You love them more than I ever could.' Then I read one Psalm until my breathing slows.",
        hoursAgo: 60,
      },
    ],
  },
  {
    id: "seed-post-9",
    sessionId: "seed-hopeful-cedar",
    category: "REFLECTION",
    title: "Why Jesus asked 'What do you want me to do for you?'",
    body: "In Mark 10, Bartimaeus is obviously blind, yet Jesus still asks him what he wants. It struck me today that the Lord does not rush past our own voice. He invites us to name our need plainly, without dressing it up in religious language.",
    sameSituation: 12,
    encouraged: 24,
    hoursAgo: 78,
    comments: [
      {
        id: "seed-comment-9a",
        sessionId: "seed-patient-pilgrim",
        body: "Needed this reminder today. Plain, honest prayer is enough.",
        hoursAgo: 74,
      },
    ],
  },
  {
    id: "seed-post-10",
    sessionId: "seed-patient-pilgrim",
    category: "ENCOURAGEMENT",
    title: "To anyone reading this in a waiting room",
    body: "Whether it is a literal hospital waiting room or a season where nothing seems to move: the God who fed Elijah by a brook in the middle of a drought has not forgotten your address. Take one slow breath. You are held right now.",
    sameSituation: 13,
    encouraged: 35,
    hoursAgo: 96,
    comments: [
      {
        id: "seed-comment-10a",
        sessionId: "seed-gentle-shepherd",
        body: "Reading this from an actual clinic waiting room. Thank you.",
        hoursAgo: 92,
      },
    ],
  },
  {
    id: "seed-post-11",
    sessionId: "seed-serene-olive",
    category: "PRAYER",
    title: "Wisdom for a difficult family decision",
    body: "My siblings and I are trying to decide the best care plan for our aging grandmother, and everyone is exhausted and tense. Please pray for gentleness in our conversations and clear wisdom from James 1:5.",
    sameSituation: 7,
    encouraged: 16,
    hoursAgo: 112,
    comments: [
      {
        id: "seed-comment-11a",
        sessionId: "seed-faithful-sparrow",
        body: "Praying for peace in your family group chat and around the table.",
        hoursAgo: 108,
      },
    ],
  },
  {
    id: "seed-post-12",
    sessionId: "seed-quiet-lantern",
    category: "TESTIMONY",
    title: "Peace in the middle of a season that didn't change",
    body: "I used to think answered prayer meant my circumstances had to turn around. This year the circumstances stayed heavy, but the fear lost its voice. I am learning that John 14:27 means a different kind of peace than the world gives.",
    sameSituation: 15,
    encouraged: 27,
    hoursAgo: 130,
    comments: [
      {
        id: "seed-comment-12a",
        sessionId: "seed-hopeful-cedar",
        body: "Amen. 'Not as the world gives' — that line has anchored me too.",
        hoursAgo: 125,
      },
    ],
  },
];

export const DUMMY_USAGE_STATS: Record<string, number> = {
  cache_hit: 42,
  cache_miss: 18,
  tokens_saved: 14820,
  llm_calls: 24,
  off_topic: 2,
  crisis_detected: 0,
  "search:total": 68,
  "search:verse:Psalm 23": 19,
  "search:verse:Philippians 4:6": 14,
  "search:verse:John 3:16": 11,
  "search:verse:Isaiah 41:10": 9,
  "search:verse:Jeremiah 29:11": 7,
  "search:topic:Anxiety": 22,
  "search:topic:Hope": 15,
  "search:topic:Forgiveness": 12,
  "search:topic:Grief": 10,
  "search:topic:Peace": 8,
  "search:category:STRUGGLES": 24,
  "search:category:PRAYER": 19,
  "search:category:TESTIMONY": 16,
  "search:category:ENCOURAGEMENT": 11,
  "search:category:REFLECTION": 8,
};

export const DUMMY_CACHED_RESPONSES: DummyCachedResponseSeed[] = [
  {
    id: "seed-cache-1",
    normalized: "i feel overwhelmed with anxiety and cannot sleep",
    response:
      "I hear how heavy that restlessness feels tonight. Scripture meets us right in the middle of anxious thoughts: \"In peace I will both lay myself down and sleep, for you, LORD, alone make me live in safety\" (Psalm 4:8). You do not have to solve tomorrow tonight. Try naming three things you can release into God's hands before you close your eyes.",
    language: "en",
    themeTags: ["anxiety", "sleep", "peace"],
    hits: 14,
    qualityScore: 5,
    votes: 5,
  },
  {
    id: "seed-cache-2",
    normalized: "i feel far from god and my prayers feel empty",
    response:
      "Feeling distant from God is one of the most honest places a believer can stand — even David cried out, \"How long, LORD? Will you forget me forever?\" (Psalm 13:1). Notice that feeling unseen is not the same as being abandoned. God's nearness rests on His promise in Christ, not on the warmth of our emotions today.",
    language: "en",
    themeTags: ["dryness", "prayer", "faith"],
    hits: 11,
    qualityScore: 4,
    votes: 4,
  },
  {
    id: "seed-cache-3",
    normalized: "how do i forgive someone who hurt me deeply",
    response:
      "Forgiveness rarely happens all at once, and it does not mean pretending the wound was small. In Ephesians 4:32, we are invited to forgive \"just as God also in Christ forgave you\" — not from our own strength, but from the mercy we have already received. Start by handing the justice of the situation to God, and ask Him for the grace to release the debt one day at a time.",
    language: "en",
    themeTags: ["forgiveness", "healing", "grace"],
    hits: 9,
    qualityScore: 3,
    votes: 3,
  },
];

export const DUMMY_MODERATION_LOGS = [
  {
    id: "seed-mod-1",
    targetType: "post",
    targetId: "seed-post-1",
    action: "allow",
    scores: "{}",
    reason: "",
    hoursAgo: 4,
  },
  {
    id: "seed-mod-2",
    targetType: "post",
    targetId: "seed-post-2",
    action: "allow",
    scores: "{}",
    reason: "",
    hoursAgo: 9,
  },
  {
    id: "seed-mod-3",
    targetType: "comment",
    targetId: "seed-comment-1a",
    action: "allow",
    scores: "{}",
    reason: "",
    hoursAgo: 3,
  },
];

// Local 256-dim deterministic embedding (mirrors src/lib/ai/provider.ts#localEmbed)
const LOCAL_DIM = 256;

function tokenize(text: string): string[] {
  const words = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
  const tokens: string[] = [];
  for (let i = 0; i < words.length; i++) {
    tokens.push(words[i]);
    if (i + 1 < words.length) tokens.push(`${words[i]}_${words[i + 1]}`);
  }
  return tokens;
}

function hashToken(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function computeLocalEmbedding(text: string): number[] {
  const vec = new Array<number>(LOCAL_DIM).fill(0);
  const tokens = tokenize(text || "");
  if (tokens.length === 0) return vec;
  for (const token of tokens) {
    vec[hashToken(token) % LOCAL_DIM] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

