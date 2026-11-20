import test from "node:test";
import assert from "node:assert/strict";
import {
  parseBibleReference,
  rankPosts,
  rankTracks,
  searchVerses,
  splitHighlightSegments,
  type GlobalSearchResponse,
} from "./search";
import {
  extractSearchLogEntries,
  sanitizeAnalyticsQuery,
  SEARCH_STAT_PREFIX,
  summarizeSearchAnalytics,
} from "./search-analytics-core";
import { DUMMY_POSTS, DUMMY_TRACKS } from "./dummy-data";

test("parseBibleReference parses standard, singular, numbered, and abbreviated Scripture refs", () => {
  assert.deepEqual(parseBibleReference("John 3:16"), {
    bookId: "JHN",
    bookName: "John",
    chapter: 3,
    verse: 16,
    label: "John 3:16",
    href: "/bible?book=JHN&chapter=3&verse=16",
  });

  assert.deepEqual(parseBibleReference("Psalm 23"), {
    bookId: "PSA",
    bookName: "Psalms",
    chapter: 23,
    verse: undefined,
    label: "Psalm 23",
    href: "/bible?book=PSA&chapter=23",
  });

  assert.deepEqual(parseBibleReference("1 Cor 13:4-5"), {
    bookId: "1CO",
    bookName: "1 Corinthians",
    chapter: 13,
    verse: 4,
    label: "1 Corinthians 13:4",
    href: "/bible?book=1CO&chapter=13&verse=4",
  });

  assert.equal(parseBibleReference("Philippians")?.href, "/bible?book=PHP&chapter=1");
  assert.equal(parseBibleReference("John 99"), null);
  assert.equal(parseBibleReference("anxiety"), null);
});

test("searchVerses matches references, themes, and verse text with relevant ordering", () => {
  const byRef = searchVerses("Psalm 23");
  assert.ok(byRef.length >= 1);
  assert.equal(byRef[0].ref, "Psalm 23:4");
  assert.equal(byRef[0].href, "/bible?book=PSA&chapter=23&verse=4");

  const byTheme = searchVerses("anxiety");
  assert.ok(byTheme.length >= 3);
  assert.ok(byTheme.every((v) => v.theme === "anxiety" || v.text.toLowerCase().includes("anxi")));

  assert.deepEqual(searchVerses("zzzxxyyqqq"), []);
});

test("rankPosts ranks title matches above body matches and filters hidden posts", () => {
  const inputs = DUMMY_POSTS.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    category: p.category,
    hidden: p.hidden,
    sameSituation: p.sameSituation,
    encouraged: p.encouraged,
    commentCount: p.comments.length,
    createdAt: new Date(),
  }));

  const anxietyHits = rankPosts(inputs, "anxiety");
  assert.ok(anxietyHits.length >= 1);
  assert.equal(anxietyHits[0].id, "seed-post-1");
  assert.equal(anxietyHits[0].href, "/community/seed-post-1");

  // Multi-word non-contiguous query should still center the excerpt on a matched keyword
  const multiWordHits = rankPosts(inputs, "anxiety Philippians");
  assert.ok(multiWordHits.length >= 1);
  assert.ok(
    multiWordHits[0].excerpt.toLowerCase().includes("anxiety") ||
      multiWordHits[0].excerpt.toLowerCase().includes("philippians")
  );

  const hiddenExcluded = rankPosts(
    [{ ...inputs[0], hidden: true }],
    "anxiety"
  );
  assert.equal(hiddenExcluded.length, 0);
});

test("rankTracks finds instrumental tracks by title, scripture reference, and description", () => {
  const byTitle = rankTracks(DUMMY_TRACKS, "Still Waters");
  assert.ok(byTitle.length >= 1);
  assert.equal(byTitle[0].title, "Still Waters");

  const byScripture = rankTracks(DUMMY_TRACKS, "Psalm 23");
  assert.ok(byScripture.length >= 1);
  assert.equal(byScripture[0].title, "Still Waters");

  const byMood = rankTracks(DUMMY_TRACKS, "anchor");
  assert.ok(byMood.some((t) => t.title === "Anchor in the Deep"));
});

test("splitHighlightSegments highlights phrases and multi-word tokens safely while preserving case", () => {
  const single = splitHighlightSegments("Cast all your Anxiety on Him.", "anxiety");
  assert.deepEqual(single, [
    { text: "Cast all your ", match: false },
    { text: "Anxiety", match: true },
    { text: " on Him.", match: false },
  ]);

  const multi = splitHighlightSegments(
    "Trying to believe Psalm 23 is still true in a hard season.",
    "psalm 23"
  );
  assert.deepEqual(multi, [
    { text: "Trying to believe ", match: false },
    { text: "Psalm 23", match: true },
    { text: " is still true in a hard season.", match: false },
  ]);

  const regexChars = splitHighlightSegments("Hope (firm + secure)?", "hope (firm");
  assert.ok(regexChars.some((s) => s.match && s.text.toLowerCase().includes("hope")));

  const empty = splitHighlightSegments("Still waters", " ");
  assert.deepEqual(empty, [{ text: "Still waters", match: false }]);
});

test("extractSearchLogEntries classifies Bible verses, community topics, scrubs PII, and skips fragments", () => {
  // Short typing fragment is ignored
  const fragment: GlobalSearchResponse = {
    query: "ho",
    bibleJump: null,
    verses: [],
    posts: [],
    tracks: [],
    total: 0,
  };
  assert.deepEqual(extractSearchLogEntries(fragment), []);

  // Bible reference query records canonical Bible verse + matched categories
  const psalmJump = parseBibleReference("ps 23");
  const psalmResponse: GlobalSearchResponse = {
    query: "ps 23",
    bibleJump: psalmJump,
    verses: searchVerses("ps 23", 3),
    posts: [
      {
        id: "seed-post-6",
        title: "Starting over at 45",
        excerpt: "Trying to believe Psalm 23 is still true...",
        category: "PRAYER",
        categoryLabel: "Prayer Request",
        commentCount: 2,
        href: "/community/seed-post-6",
      },
    ],
    tracks: [],
    total: 5,
  };
  const psalmEntries = extractSearchLogEntries(psalmResponse);
  assert.ok(psalmEntries.some((e) => e.key === SEARCH_STAT_PREFIX.total));
  assert.ok(psalmEntries.some((e) => e.key === `${SEARCH_STAT_PREFIX.verse}Psalm 23`));
  assert.ok(psalmEntries.some((e) => e.key === `${SEARCH_STAT_PREFIX.category}PRAYER`));

  // Community topic query canonicalizes curated theme and records matched category
  const anxietyResponse: GlobalSearchResponse = {
    query: "anxiety",
    bibleJump: null,
    verses: searchVerses("anxiety", 3),
    posts: [
      {
        id: "seed-post-1",
        title: "Twelve years of anxiety",
        excerpt: "constant hum of anxiety",
        category: "TESTIMONY",
        categoryLabel: "Testimony",
        commentCount: 2,
        href: "/community/seed-post-1",
      },
    ],
    tracks: [],
    total: 4,
  };
  const anxietyEntries = extractSearchLogEntries(anxietyResponse);
  assert.ok(anxietyEntries.some((e) => e.key === `${SEARCH_STAT_PREFIX.topic}Anxiety`));
  assert.ok(anxietyEntries.some((e) => e.key === `${SEARCH_STAT_PREFIX.category}TESTIMONY`));

  // PII scrubbing strips emails, phones, handles, and URLs
  const scrubbed = sanitizeAnalyticsQuery("pray for john@example.com 555-234-5678 @john https://site.com grief");
  assert.equal(scrubbed, "pray for grief");
});

test("summarizeSearchAnalytics aggregates and ranks top verses, topics, and categories", () => {
  const now = new Date("2026-11-20T06:00:00.000Z");
  const summary = summarizeSearchAnalytics(
    [
      { key: "cache_hit", value: 42, updatedAt: now },
      { key: "search:total", value: 30, updatedAt: now },
      { key: "search:verse:John 3:16", value: 5, updatedAt: now },
      { key: "search:verse:Psalm 23", value: 12, updatedAt: now },
      { key: "search:topic:Forgiveness", value: 4, updatedAt: now },
      { key: "search:topic:Anxiety", value: 9, updatedAt: now },
      { key: "search:category:PRAYER", value: 8, updatedAt: now },
      { key: "search:category:STRUGGLES", value: 11, updatedAt: now },
    ],
    5
  );

  assert.equal(summary.totalSearches, 30);
  assert.deepEqual(
    summary.topVerses.map((v) => [v.label, v.count]),
    [
      ["Psalm 23", 12],
      ["John 3:16", 5],
    ]
  );
  assert.deepEqual(
    summary.topTopics.map((t) => [t.label, t.count]),
    [
      ["Anxiety", 9],
      ["Forgiveness", 4],
    ]
  );
  assert.deepEqual(
    summary.topCategories.map((c) => [c.label, c.count]),
    [
      ["Struggles", 11],
      ["Prayer Request", 8],
    ]
  );
});
