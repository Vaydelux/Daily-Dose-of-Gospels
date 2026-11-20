import { CATEGORY_LABELS, type GlobalSearchResponse } from "./search";
import { THEMES } from "./verses-bank";

export const SEARCH_STAT_PREFIX = {
  total: "search:total",
  verse: "search:verse:",
  topic: "search:topic:",
  category: "search:category:",
} as const;

export type SearchLogIncrement = {
  key: string;
  by: number;
};

export type SearchAnalyticsItem = {
  label: string;
  count: number;
  lastSearchedAt: string;
};

export type SearchCategoryItem = {
  category: string;
  label: string;
  count: number;
};

export type SearchAnalyticsSummary = {
  totalSearches: number;
  topVerses: SearchAnalyticsItem[];
  topTopics: SearchAnalyticsItem[];
  topCategories: SearchCategoryItem[];
};

export type UsageStatRowLike = {
  key: string;
  value: number;
  updatedAt: Date | string;
};

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}\b/g;
const URL_RE = /https?:\/\/\S+|www\.\S+/gi;
const HANDLE_RE = /(?:^|\s)@[a-z0-9_]{3,30}\b/gi;
const LONG_NUM_RE = /\b\d{7,}\b/g;

/** Scrub obvious PII before normalizing a search query for anonymous analytics. */
export function sanitizeAnalyticsQuery(raw: string): string {
  return (raw ?? "")
    .replace(EMAIL_RE, " ")
    .replace(URL_RE, " ")
    .replace(HANDLE_RE, " ")
    .replace(PHONE_RE, (m) => (m.replace(/\D/g, "").length >= 7 ? " " : m))
    .replace(LONG_NUM_RE, " ")
    .replace(/[^a-zA-Z0-9\s:'.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);
}

const THEME_LOOKUP = THEMES.map((t) => ({
  key: t.key,
  label: t.label,
  lowerKey: t.key.toLowerCase(),
  lowerLabel: t.label.toLowerCase(),
  words: t.label
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3),
}));

function matchCanonicalTopic(cleanedLower: string): string | null {
  for (const t of THEME_LOOKUP) {
    if (
      cleanedLower === t.lowerKey ||
      cleanedLower === t.lowerLabel ||
      t.words.includes(cleanedLower)
    ) {
      return t.label;
    }
  }
  return null;
}

function toDisplayTopic(cleaned: string): string {
  const lower = cleaned.toLowerCase();
  const canonical = matchCanonicalTopic(lower);
  if (canonical) return canonical;
  // Capitalize first letter for neat admin display while keeping phrase concise.
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Derive anonymous UsageStat increments from a completed search response.
 * Records:
 *  - total searches
 *  - queried Bible verse/passage (canonical Bible reference or top phrase-matched verse)
 *  - queried community/spiritual topic (PII-scrubbed normalized topic)
 *  - matched community categories (for topic breakdown)
 */
export function extractSearchLogEntries(
  response: GlobalSearchResponse
): SearchLogIncrement[] {
  const sanitized = sanitizeAnalyticsQuery(response.query);
  if (!sanitized) return [];

  // Skip 1–2 char typing fragments unless they resolved to a valid Bible reference.
  if (sanitized.length < 3 && !response.bibleJump) {
    return [];
  }

  const increments: SearchLogIncrement[] = [
    { key: SEARCH_STAT_PREFIX.total, by: 1 },
  ];

  const verseKeys = new Set<string>();
  const topicKeys = new Set<string>();
  const categoryKeys = new Set<string>();

  // 1. Bible verse / passage frequency
  if (response.bibleJump) {
    verseKeys.add(response.bibleJump.label);
  } else if (response.verses.length > 0) {
    const lower = sanitized.toLowerCase();
    const topVerse = response.verses[0];
    // Record specific verse when query matches its reference or a multi-word verse phrase.
    const refLower = topVerse.ref.toLowerCase();
    const looksLikeRefOrPassage =
      refLower.includes(lower) ||
      lower.includes(refLower) ||
      (sanitized.includes(" ") && topVerse.text.toLowerCase().includes(lower));
    if (looksLikeRefOrPassage) {
      verseKeys.add(topVerse.ref);
    }
  }

  // 2. Community / spiritual topic frequency (for non-pure-reference searches or when posts/themes matched)
  const lowerSanitized = sanitized.toLowerCase();
  const matchedTheme = matchCanonicalTopic(lowerSanitized);
  if (matchedTheme) {
    topicKeys.add(matchedTheme);
  } else if (!response.bibleJump) {
    topicKeys.add(toDisplayTopic(sanitized));
  }

  // 3. Community categories matched by this query
  if (response.posts.length > 0) {
    for (const post of response.posts.slice(0, 3)) {
      if (post.category) categoryKeys.add(post.category);
    }
  }

  for (const v of verseKeys) {
    increments.push({ key: `${SEARCH_STAT_PREFIX.verse}${v}`, by: 1 });
  }
  for (const t of topicKeys) {
    increments.push({ key: `${SEARCH_STAT_PREFIX.topic}${t}`, by: 1 });
  }
  for (const c of categoryKeys) {
    increments.push({ key: `${SEARCH_STAT_PREFIX.category}${c}`, by: 1 });
  }

  return increments;
}

/**
 * Aggregate UsageStat rows into ranked Bible verse & community topic insights for /admin.
 */
export function summarizeSearchAnalytics(
  rows: UsageStatRowLike[],
  limit = 10
): SearchAnalyticsSummary {
  let totalSearches = 0;
  const verses: SearchAnalyticsItem[] = [];
  const topics: SearchAnalyticsItem[] = [];
  const categories: SearchCategoryItem[] = [];

  for (const row of rows) {
    if (!row || typeof row.key !== "string" || typeof row.value !== "number") continue;
    const iso =
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : new Date(row.updatedAt).toISOString();

    if (row.key === SEARCH_STAT_PREFIX.total) {
      totalSearches = row.value;
    } else if (row.key.startsWith(SEARCH_STAT_PREFIX.verse)) {
      const label = row.key.slice(SEARCH_STAT_PREFIX.verse.length).trim();
      if (label && row.value > 0) {
        verses.push({ label, count: row.value, lastSearchedAt: iso });
      }
    } else if (row.key.startsWith(SEARCH_STAT_PREFIX.topic)) {
      const label = row.key.slice(SEARCH_STAT_PREFIX.topic.length).trim();
      if (label && row.value > 0) {
        topics.push({ label, count: row.value, lastSearchedAt: iso });
      }
    } else if (row.key.startsWith(SEARCH_STAT_PREFIX.category)) {
      const category = row.key.slice(SEARCH_STAT_PREFIX.category.length).trim();
      if (category && row.value > 0) {
        categories.push({
          category,
          label: CATEGORY_LABELS[category] ?? category,
          count: row.value,
        });
      }
    }
  }

  const byCountDesc = (a: { count: number; label: string }, b: { count: number; label: string }) =>
    b.count - a.count || a.label.localeCompare(b.label);

  verses.sort(byCountDesc);
  topics.sort(byCountDesc);
  categories.sort(byCountDesc);

  return {
    totalSearches,
    topVerses: verses.slice(0, limit),
    topTopics: topics.slice(0, limit),
    topCategories: categories.slice(0, limit),
  };
}
