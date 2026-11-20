import "server-only";
import { db } from "@/lib/db";
import type { GlobalSearchResponse } from "@/lib/search";
import {
  extractSearchLogEntries,
  summarizeSearchAnalytics,
  type SearchAnalyticsSummary,
} from "@/lib/search-analytics-core";

export type { SearchAnalyticsSummary } from "@/lib/search-analytics-core";

/**
 * Anonymously record queried Bible verses, community topics, and matched
 * community categories in UsageStat so admins can see what visitors seek most.
 * Never throws so search responses remain resilient even if logging fails.
 */
export async function recordSearchAnalytics(
  response: GlobalSearchResponse
): Promise<void> {
  const entries = extractSearchLogEntries(response);
  if (entries.length === 0) return;

  try {
    await Promise.all(
      entries.map(({ key, by }) =>
        db.usageStat.upsert({
          where: { key },
          update: { value: { increment: by }, updatedAt: new Date() },
          create: { key, value: by },
        })
      )
    );
  } catch (err) {
    console.warn("[search-analytics] failed to record search query:", err);
  }
}

/** Read and summarize top queried Bible verses & community topics for /admin. */
export async function getSearchAnalyticsSummary(
  limit = 10
): Promise<SearchAnalyticsSummary> {
  const rows = await db.usageStat.findMany();
  return summarizeSearchAnalytics(rows, limit);
}
