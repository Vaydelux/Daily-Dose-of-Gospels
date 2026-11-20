import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  parseBibleReference,
  rankPosts,
  rankTracks,
  searchVerses,
  type GlobalSearchResponse,
} from "@/lib/search";
import { recordSearchAnalytics } from "@/lib/search-analytics";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=...
 * Unified search across Bible references, curated verses, visible community
 * posts, and published worship instrumentals.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("q") ?? "";
  const query = raw.trim().slice(0, 100);

  if (!query) {
    const empty: GlobalSearchResponse = {
      query: "",
      bibleJump: null,
      verses: [],
      posts: [],
      tracks: [],
      total: 0,
    };
    return NextResponse.json(empty);
  }

  const bibleJump = parseBibleReference(query);
  const verses = searchVerses(query, 6);

  const [rawPosts, rawTracks] = await Promise.all([
    db.post.findMany({
      where: { hidden: false },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { _count: { select: { comments: { where: { hidden: false } } } } },
    }),
    db.track.findMany({
      where: { published: true },
      orderBy: [{ album: "asc" }, { trackOrder: "asc" }, { createdAt: "asc" }],
      take: 100,
    }),
  ]);

  const posts = rankPosts(
    rawPosts.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      category: p.category,
      hidden: p.hidden,
      sameSituation: p.sameSituation,
      encouraged: p.encouraged,
      commentCount: p._count.comments,
      createdAt: p.createdAt,
    })),
    query,
    6
  );

  const tracks = rankTracks(
    rawTracks.map((t) => ({
      id: t.id,
      title: t.title,
      album: t.album,
      scripture: t.scripture,
      description: t.description,
      lyrics: t.lyrics,
      coverUrl: t.coverUrl,
      audioUrl: t.audioUrl,
      durationSec: t.durationSec,
      playCount: t.playCount,
      published: t.published,
    })),
    query,
    6
  );

  const total = (bibleJump ? 1 : 0) + verses.length + posts.length + tracks.length;

  const payload: GlobalSearchResponse = {
    query,
    bibleJump,
    verses,
    posts,
    tracks,
    total,
  };

  if (req.nextUrl.searchParams.get("log") !== "0") {
    await recordSearchAnalytics(payload);
  }

  return NextResponse.json(payload);
}
