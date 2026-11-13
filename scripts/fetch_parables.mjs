/**
 * Generates src/lib/parables-bank.ts — a curated bank of REAL parables from the
 * Bible, with verbatim text fetched from bible-api.com (World English Bible,
 * public domain). No invented content: title / note / themes are human labels,
 * but every word of `text` and `take` comes from the API response itself.
 *
 * Run: bun scripts/fetch_parables.mjs
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const TRANSLATION = "web";
const TRANSLATION_NAME = "World English Bible (public domain)";

const PARABLES = [
  {
    slug: "two-foundations",
    title: "The Wise and the Foolish Builders",
    ref: "Matthew 7:24-27",
    query: "matthew+7:24-27",
    keyRef: "Matthew 7:24",
    themes: ["hearing and doing", "the kingdom"],
    note: "Jesus closed the Sermon on the Mount with this picture of two foundations.",
  },
  {
    slug: "sower",
    title: "The Parable of the Sower",
    ref: "Matthew 13:3-9",
    query: "matthew+13:3-9",
    keyRef: "Matthew 13:9",
    themes: ["the word of God", "hearts"],
    note: "Told from a boat by the Sea of Galilee; Jesus explained it privately in Matthew 13:18-23.",
  },
  {
    slug: "mustard-seed",
    title: "The Mustard Seed",
    ref: "Matthew 13:31-32",
    query: "matthew+13:31-32",
    keyRef: "Matthew 13:32",
    themes: ["the kingdom", "hope"],
    note: "One of the kingdom parables Jesus told the crowds that day (Matthew 13).",
  },
  {
    slug: "leaven",
    title: "The Yeast",
    ref: "Matthew 13:33",
    query: "matthew+13:33",
    keyRef: "Matthew 13:33",
    themes: ["the kingdom"],
    note: "Told in the same series of kingdom parables as the mustard seed.",
  },
  {
    slug: "hidden-treasure",
    title: "The Hidden Treasure",
    ref: "Matthew 13:44",
    query: "matthew+13:44",
    keyRef: "Matthew 13:44",
    themes: ["the kingdom", "treasure"],
    note: "Told to the crowds beside the sea.",
  },
  {
    slug: "pearl",
    title: "The Pearl of Great Price",
    ref: "Matthew 13:45-46",
    query: "matthew+13:45-46",
    keyRef: "Matthew 13:46",
    themes: ["the kingdom", "treasure"],
    note: "The twin of the hidden treasure — a merchant who sells everything for one pearl.",
  },
  {
    slug: "net",
    title: "The Dragnet",
    ref: "Matthew 13:47-50",
    query: "matthew+13:47-50",
    keyRef: "Matthew 13:49",
    themes: ["the kingdom", "judgment"],
    note: "Jesus closed the day's kingdom parables with this picture of the end of the age.",
  },
  {
    slug: "unmerciful-servant",
    title: "The Unmerciful Servant",
    ref: "Matthew 18:21-35",
    query: "matthew+18:21-35",
    keyRef: "Matthew 18:35",
    themes: ["forgiveness", "mercy"],
    note: "Jesus' answer when Peter asked whether forgiving seven times was enough.",
  },
  {
    slug: "vineyard-workers",
    title: "The Workers in the Vineyard",
    ref: "Matthew 20:1-16",
    query: "matthew+20:1-16",
    keyRef: "Matthew 20:16",
    themes: ["grace", "generosity"],
    note: "Told on the road to Jerusalem, right after Peter asked what the disciples would get for leaving everything.",
  },
  {
    slug: "two-sons",
    title: "The Two Sons",
    ref: "Matthew 21:28-32",
    query: "matthew+21:28-32",
    keyRef: "Matthew 21:31",
    themes: ["repentance", "obedience"],
    note: "Told to the chief priests and elders in the temple courts.",
  },
  {
    slug: "wicked-tenants",
    title: "The Wicked Tenants",
    ref: "Matthew 21:33-44",
    query: "matthew+21:33-44",
    keyRef: "Matthew 21:42",
    themes: ["the kingdom", "judgment"],
    note: "Spoken against the religious leaders in His last week, quoting Psalm 118.",
  },
  {
    slug: "wedding-banquet",
    title: "The Wedding Banquet",
    ref: "Matthew 22:1-14",
    query: "matthew+22:1-14",
    keyRef: "Matthew 22:14",
    themes: ["invitation", "the kingdom"],
    note: "Another parable for the same audience: the invited guests who would not come.",
  },
  {
    slug: "ten-virgins",
    title: "The Ten Virgins",
    ref: "Matthew 25:1-13",
    query: "matthew+25:1-13",
    keyRef: "Matthew 25:13",
    themes: ["readiness", "hope"],
    note: "Part of the Mount of Olives teaching about the day of His coming.",
  },
  {
    slug: "talents",
    title: "The Talents",
    ref: "Matthew 25:14-30",
    query: "matthew+25:14-30",
    keyRef: "Matthew 25:21",
    themes: ["stewardship", "faithfulness"],
    note: "The same evening — what to do while the Master is away.",
  },
  {
    slug: "sheep-and-goats",
    title: "The Sheep and the Goats",
    ref: "Matthew 25:31-46",
    query: "matthew+25:31-46",
    keyRef: "Matthew 25:40",
    themes: ["compassion", "judgment"],
    note: "Jesus' last word in that teaching: how He will separate the nations as a shepherd does.",
  },
  {
    slug: "growing-seed",
    title: "The Seed Growing Secretly",
    ref: "Mark 4:26-29",
    query: "mark+4:26-29",
    keyRef: "Mark 4:28",
    themes: ["the kingdom", "patience"],
    note: "Told by the sea, among the seed-and-harvest parables of Mark 4.",
  },
  {
    slug: "lamp-stand",
    title: "A Lamp on a Stand",
    ref: "Mark 4:21-25",
    query: "mark+4:21-25",
    keyRef: "Mark 4:22",
    themes: ["light", "truth"],
    note: "A saying Jesus repeated: nothing hidden is meant to stay hidden.",
  },
  {
    slug: "two-debtors",
    title: "The Two Debtors",
    ref: "Luke 7:41-43",
    query: "luke+7:41-43",
    keyRef: "Luke 7:43",
    themes: ["forgiveness", "love"],
    note: "Told at dinner in Simon the Pharisee's house, while a weeping woman anointed Jesus' feet.",
  },
  {
    slug: "good-samaritan",
    title: "The Good Samaritan",
    ref: "Luke 10:25-37",
    query: "luke+10:25-37",
    keyRef: "Luke 10:37",
    themes: ["love", "neighbor"],
    note: "Jesus' answer to a lawyer's question, \"Who is my neighbor?\"",
  },
  {
    slug: "friend-at-midnight",
    title: "The Friend at Midnight",
    ref: "Luke 11:5-13",
    query: "luke+11:5-13",
    keyRef: "Luke 11:9",
    themes: ["prayer", "persistence"],
    note: "Told right after Jesus taught the disciples to pray.",
  },
  {
    slug: "rich-fool",
    title: "The Rich Fool",
    ref: "Luke 12:16-21",
    query: "luke+12:16-21",
    keyRef: "Luke 12:21",
    themes: ["money", "perspective"],
    note: "Spoken when a man in the crowd asked Jesus to settle an inheritance.",
  },
  {
    slug: "watchful-servants",
    title: "The Watchful Servants",
    ref: "Luke 12:35-40",
    query: "luke+12:35-40",
    keyRef: "Luke 12:40",
    themes: ["readiness"],
    note: "Continuing the teaching about treasure that does not fade.",
  },
  {
    slug: "barren-fig-tree",
    title: "The Barren Fig Tree",
    ref: "Luke 13:6-9",
    query: "luke+13:6-9",
    keyRef: "Luke 13:9",
    themes: ["repentance", "patience"],
    note: "After Jesus was told about the Galileans Pilate had killed — a call to repentance.",
  },
  {
    slug: "great-banquet",
    title: "The Great Banquet",
    ref: "Luke 14:15-24",
    query: "luke+14:15-24",
    keyRef: "Luke 14:23",
    themes: ["invitation", "grace"],
    note: "Told at a Sabbath meal in the house of a ruler of the Pharisees.",
  },
  {
    slug: "counting-cost",
    title: "Building a Tower, Counting the Cost",
    ref: "Luke 14:28-33",
    query: "luke+14:28-33",
    keyRef: "Luke 14:33",
    themes: ["discipleship", "commitment"],
    note: "Spoken to the great crowds travelling with Him.",
  },
  {
    slug: "lost-sheep",
    title: "The Lost Sheep",
    ref: "Luke 15:3-7",
    query: "luke+15:3-7",
    keyRef: "Luke 15:7",
    themes: ["lost and found", "joy"],
    note: "First of the three 'lost' parables in Luke 15, told while the Pharisees muttered.",
  },
  {
    slug: "lost-coin",
    title: "The Lost Coin",
    ref: "Luke 15:8-10",
    query: "luke+15:8-10",
    keyRef: "Luke 15:10",
    themes: ["lost and found", "joy"],
    note: "The second of the three — a woman's lamp and broom.",
  },
  {
    slug: "lost-son",
    title: "The Lost Son (Prodigal Son)",
    ref: "Luke 15:11-32",
    query: "luke+15:11-32",
    keyRef: "Luke 15:32",
    themes: ["lost and found", "grace"],
    note: "The longest of the three 'lost' parables — about a father who runs.",
  },
  {
    slug: "shrewd-manager",
    title: "The Shrewd Manager",
    ref: "Luke 16:1-13",
    query: "luke+16:1-13",
    keyRef: "Luke 16:10",
    themes: ["money", "faithfulness"],
    note: "Told to the disciples while the money-loving Pharisees listened (Luke 16:14).",
  },
  {
    slug: "rich-man-lazarus",
    title: "The Rich Man and Lazarus",
    ref: "Luke 16:19-31",
    query: "luke+16:19-31",
    keyRef: "Luke 16:31",
    themes: ["money", "mercy"],
    note: "Spoken to the Pharisees who mocked His teaching about money.",
  },
  {
    slug: "persistent-widow",
    title: "The Persistent Widow",
    ref: "Luke 18:1-8",
    query: "luke+18:1-8",
    keyRef: "Luke 18:1",
    themes: ["prayer", "persistence"],
    note: "Luke tells us its purpose himself: to show that we should always pray and not give up.",
  },
  {
    slug: "pharisee-tax-collector",
    title: "The Pharisee and the Tax Collector",
    ref: "Luke 18:10-14",
    query: "luke+18:10-14",
    keyRef: "Luke 18:14",
    themes: ["humility", "prayer"],
    note: "Aimed at those who were confident of their own righteousness.",
  },
  {
    slug: "ten-minas",
    title: "The Ten Minas",
    ref: "Luke 19:11-27",
    query: "luke+19:11-27",
    keyRef: "Luke 19:26",
    themes: ["stewardship", "readiness"],
    note: "Near Jericho, on the way up to Jerusalem — because the people thought the kingdom would appear at once.",
  },
  {
    slug: "nathan-ewe-lamb",
    title: "The Little Ewe Lamb",
    ref: "2 Samuel 12:1-7",
    query: "2+samuel+12:1-7",
    keyRef: "2 Samuel 12:7",
    themes: ["repentance", "truth"],
    note: "The prophet Nathan's parable to King David after his sin with Bathsheba (2 Samuel 12).",
  },
  {
    slug: "isaiah-vineyard",
    title: "The Song of the Vineyard",
    ref: "Isaiah 5:1-7",
    query: "isaiah+5:1-7",
    keyRef: "Isaiah 5:7",
    themes: ["judgment", "hope"],
    note: "The prophet Isaiah's love-song about a friend's vineyard — God's own case against Judah and Jerusalem.",
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Resume cache — bible-api.com rate-limits aggressively, so successful
// passages are persisted and re-runs only fetch what is missing.
const CACHE_FILE = "scripts/.parables-cache.json";
const cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, "utf8")) : {};
function persistCache() {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1), "utf8");
}

async function fetchPassage(p) {
  if (cache[p.slug]) return cache[p.slug];
  const url = `https://bible-api.com/${p.query}?translation=${TRANSLATION}`;
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        const wait = 8000 * attempt;
        console.log(`  429 on ${p.slug}, waiting ${wait / 1000}s…`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.verses) || data.verses.length === 0) {
        throw new Error(`no verses for ${p.ref}`);
      }
      cache[p.slug] = data;
      persistCache();
      return data;
    } catch (err) {
      if (attempt === 8) throw new Error(`FAILED ${p.slug} (${p.query}): ${err.message}`);
      await sleep(2000 * attempt);
    }
  }
}

function normalize(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

const results = [];
for (const p of PARABLES) {
  const data = await fetchPassage(p);
  const verses = data.verses.map((v) => ({
    n: v.verse,
    ch: v.chapter,
    text: normalize(v.text),
  }));
  const text = verses.map((v) => `${v.n} ${v.text}`).join(" ");
  const key = verses.find((v) => keyVerseMatches(p.keyRef, v, data));
  if (!key) throw new Error(`key verse not found for ${p.slug} (${p.keyRef})`);
  results.push({ ...p, text, take: key.text });
  console.log(`  ok  ${p.slug.padEnd(24)} ${p.ref}  (${verses.length} verses)`);
  await sleep(1400);
}

function keyVerseMatches(keyRef, verse, data) {
  // keyRef like "Luke 15:24" / "2 Samuel 12:7"
  const m = keyRef.match(/:(\d+)$/);
  if (!m) return false;
  return verse.n === Number(m[1]);
}

const header = `/**
 * Parable bank — REAL parables from the Bible only. Nothing here is invented.
 *
 * Every word of \`text\` and \`take\` was fetched verbatim from bible-api.com in the
 * ${TRANSLATION_NAME}. \`title\`, \`note\` and \`themes\` are human labels
 * (title = the traditional name the church uses for the passage).
 *
 * Generated by \`bun scripts/fetch_parables.mjs\` — do not hand-edit the text fields.
 */

export type Parable = {
  slug: string;
  title: string;
  ref: string; // e.g. "Luke 15:11-32"
  keyRef: string; // one highlighted verse from the passage, e.g. "Luke 15:32"
  themes: string[];
  note: string; // one-sentence factual context (who heard it, where)
  translation: string;
  text: string; // verbatim Scripture, verses numbered
  take: string; // verbatim text of the key verse
};

export const PARABLES: Parable[] = [
`;

const body = results
  .map((p) => {
    const j = (s) => JSON.stringify(s);
    return `  {
    slug: ${j(p.slug)},
    title: ${j(p.title)},
    ref: ${j(p.ref)},
    keyRef: ${j(p.keyRef)},
    themes: ${j(p.themes)},
    note: ${j(p.note)},
    translation: ${j(TRANSLATION_NAME)},
    text: ${j(p.text)},
    take: ${j(p.take)},
  },`;
  })
  .join("\n");

const footer = `
];

export function parableBySlug(slug: string): Parable | undefined {
  return PARABLES.find((p) => p.slug === slug);
}

/** Deterministic daily rotation: one parable per UTC day, cycling forever. */
export function parableOfDay(dateKey: string): Parable {
  const days = Math.floor(
    (new Date(\`\${dateKey}T00:00:00Z\`).getTime() - new Date("2024-01-01T00:00:00Z").getTime()) / 86400000
  );
  return PARABLES[Math.abs(days) % PARABLES.length];
}

/** Stable link for reading the passage in context. */
export function bibleGatewayUrl(ref: string): string {
  return \`https://www.biblegateway.com/passage/?search=\${encodeURIComponent(ref)}&version=WEB\`;
}
`;

writeFileSync("src/lib/parables-bank.ts", header + body + footer, "utf8");
console.log(`\nWrote src/lib/parables-bank.ts with ${results.length} parables.`);
