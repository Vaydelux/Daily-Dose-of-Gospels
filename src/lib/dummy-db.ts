import type { PrismaClient } from "@prisma/client";
import {
  DUMMY_CACHED_RESPONSES,
  DUMMY_MODERATION_LOGS,
  DUMMY_PLAYLIST,
  DUMMY_POSTS,
  DUMMY_SESSIONS,
  DUMMY_TRACKS,
  DUMMY_USAGE_STATS,
  computeLocalEmbedding,
} from "./dummy-data";

type RecordRow = Record<string, unknown>;

let seq = 1;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

function applyNumericOp(current: number, val: unknown): number {
  if (typeof val === "number") return val;
  if (val && typeof val === "object") {
    const op = val as { increment?: number; decrement?: number };
    if (typeof op.increment === "number") return current + op.increment;
    if (typeof op.decrement === "number") return current - op.decrement;
  }
  return current;
}

function applyDataUpdate<T extends RecordRow>(row: T, data: RecordRow): T {
  const next: RecordRow = { ...row };
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    if (typeof next[k] === "number" && v && typeof v === "object" && ("increment" in v || "decrement" in v)) {
      next[k] = applyNumericOp(next[k] as number, v);
    } else {
      next[k] = v;
    }
  }
  if ("updatedAt" in next) {
    next.updatedAt = new Date();
  }
  return next as T;
}

function pickSelect<T extends RecordRow>(row: T, select?: Record<string, unknown>): Partial<T> {
  if (!select) return row;
  const out: RecordRow = {};
  for (const [k, v] of Object.entries(select)) {
    if (v === true && k in row) out[k] = row[k];
  }
  return out as Partial<T>;
}

function matchesWhere(row: RecordRow, where?: RecordRow): boolean {
  if (!where) return true;
  for (const [key, cond] of Object.entries(where)) {
    if (cond === undefined) continue;
    if (key === "OR" && Array.isArray(cond)) {
      if (!cond.some((sub) => matchesWhere(row, sub as RecordRow))) return false;
      continue;
    }
    if (key === "AND" && Array.isArray(cond)) {
      if (!cond.every((sub) => matchesWhere(row, sub as RecordRow))) return false;
      continue;
    }
    const val = row[key];
    if (cond !== null && typeof cond === "object" && !(cond instanceof Date)) {
      const obj = cond as RecordRow;
      if ("in" in obj && Array.isArray(obj.in)) {
        if (!obj.in.includes(val)) return false;
      }
      if ("not" in obj) {
        if (val === obj.not) return false;
      }
      if ("gt" in obj && typeof val === "number") {
        if (!(val > (obj.gt as number))) return false;
      }
      if ("gte" in obj) {
        const rhs = obj.gte instanceof Date ? obj.gte.getTime() : (obj.gte as number);
        const lhs = val instanceof Date ? val.getTime() : (val as number);
        if (!(lhs >= rhs)) return false;
      }
      if ("lt" in obj) {
        const rhs = obj.lt instanceof Date ? obj.lt.getTime() : (obj.lt as number);
        const lhs = val instanceof Date ? val.getTime() : (val as number);
        if (!(lhs < rhs)) return false;
      }
    } else if (val !== cond) {
      return false;
    }
  }
  return true;
}

function sortRows<T extends RecordRow>(
  rows: T[],
  orderBy?: Record<string, "asc" | "desc"> | Array<Record<string, "asc" | "desc">>
): T[] {
  if (!orderBy) return [...rows];
  const specs = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((a, b) => {
    for (const spec of specs) {
      for (const [field, dir] of Object.entries(spec)) {
        const av = a[field];
        const bv = b[field];
        const an = av instanceof Date ? av.getTime() : av;
        const bn = bv instanceof Date ? bv.getTime() : bv;
        if (an === bn) continue;
        const cmp = (an as string | number) < (bn as string | number) ? -1 : 1;
        return dir === "desc" ? -cmp : cmp;
      }
    }
    return 0;
  });
}

export function createDummyDb(): PrismaClient {
  const now = Date.now();
  const hoursAgoDate = (h: number) => new Date(now - h * 3600 * 1000);

  const sessions = DUMMY_SESSIONS.map((s) => ({
    id: s.id,
    displayName: s.displayName,
    createdAt: hoursAgoDate(168),
    lastSeenAt: new Date(now),
  }));

  const tracks = DUMMY_TRACKS.map((t, idx) => ({
    ...t,
    trackOrder: idx,
    published: true,
    createdAt: hoursAgoDate(200 - idx),
  }));

  const playlists = [{ ...DUMMY_PLAYLIST, createdAt: hoursAgoDate(200) }];
  const playlistItems = tracks.map((t, idx) => ({
    id: `seed-pli-${idx + 1}`,
    playlistId: DUMMY_PLAYLIST.id,
    trackId: t.id,
    position: idx,
  }));

  const posts = DUMMY_POSTS.map((p) => {
    const createdAt = hoursAgoDate(p.hoursAgo);
    return {
      id: p.id,
      sessionId: p.sessionId,
      category: p.category as string,
      title: p.title,
      body: p.body,
      crisisFlag: Boolean(p.crisisFlag),
      hidden: Boolean(p.hidden),
      reportCount: 0,
      sameSituation: p.sameSituation,
      encouraged: p.encouraged,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const comments = DUMMY_POSTS.flatMap((p) =>
    p.comments.map((c) => ({
      id: c.id,
      postId: p.id,
      sessionId: c.sessionId,
      body: c.body,
      crisisFlag: false,
      hidden: false,
      reportCount: 0,
      createdAt: hoursAgoDate(c.hoursAgo),
    }))
  );

  const postEmbeddings = DUMMY_POSTS.map((p) => {
    const vec = computeLocalEmbedding(`${p.title}\n${p.body}`);
    return {
      id: `seed-emb-${p.id}`,
      postId: p.id,
      dim: vec.length,
      embedding: JSON.stringify(vec),
      model: "local-hash-v1",
      createdAt: hoursAgoDate(p.hoursAgo),
    };
  });

  const reactions: Array<{
    id: string;
    postId: string;
    sessionId: string;
    type: string;
    createdAt: Date;
  }> = [];

  const reports: Array<{
    id: string;
    postId: string | null;
    commentId: string | null;
    sessionId: string;
    reason: string;
    createdAt: Date;
  }> = [];

  const conversations: Array<{
    id: string;
    sessionId: string;
    stage: string;
    summary: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  const messages: Array<{
    id: string;
    conversationId: string;
    role: string;
    content: string;
    offTopic: boolean;
    cacheHit: boolean;
    createdAt: Date;
  }> = [];

  const memoryNotes: Array<{
    id: string;
    sessionId: string;
    themes: string;
    concerns: string;
    prayed: boolean;
    notes: string;
    updatedAt: Date;
  }> = [];

  const cachedResponses = DUMMY_CACHED_RESPONSES.map((c, idx) => {
    const vec = computeLocalEmbedding(c.normalized);
    return {
      id: c.id,
      normalized: c.normalized,
      dim: vec.length,
      embedding: JSON.stringify(vec),
      model: "local-hash-v1",
      response: c.response,
      language: c.language,
      themeTags: JSON.stringify(c.themeTags),
      qualityScore: c.qualityScore,
      votes: c.votes,
      hits: c.hits,
      active: true,
      createdAt: hoursAgoDate(72 - idx * 12),
      lastHitAt: hoursAgoDate(4 + idx * 3),
    };
  });

  const moderationLogs = DUMMY_MODERATION_LOGS.map((m) => ({
    id: m.id,
    targetType: m.targetType,
    targetId: m.targetId,
    action: m.action,
    scores: m.scores,
    reason: m.reason,
    createdAt: hoursAgoDate(m.hoursAgo),
  }));

  const usageStats = Object.entries(DUMMY_USAGE_STATS).map(([key, value], idx) => ({
    id: `seed-stat-${idx + 1}`,
    key,
    value,
    updatedAt: new Date(now),
  }));

  const findSessionName = (sessionId: string) =>
    sessions.find((s) => s.id === sessionId)?.displayName ?? "Anonymous Friend";

  const dummy = {
    anonSession: {
      async upsert({ where, update, create }: { where: { id: string }; update: RecordRow; create: RecordRow }) {
        const existing = sessions.find((s) => s.id === where.id);
        if (existing) {
          Object.assign(existing, applyDataUpdate(existing, update));
          return existing;
        }
        const row = {
          id: (create.id as string) || nextId("sess"),
          displayName: create.displayName as string,
          createdAt: new Date(),
          lastSeenAt: new Date(),
        };
        sessions.push(row);
        return row;
      },
    },

    post: {
      async findMany(args: RecordRow = {}) {
        let list = posts.filter((p) => matchesWhere(p, args.where as RecordRow));
        list = sortRows(list, args.orderBy as Record<string, "asc" | "desc">);
        if (args.cursor && typeof (args.cursor as { id?: string }).id === "string") {
          const idx = list.findIndex((p) => p.id === (args.cursor as { id: string }).id);
          if (idx >= 0) list = list.slice(idx + (typeof args.skip === "number" ? args.skip : 0));
        }
        if (typeof args.take === "number") list = list.slice(0, args.take);

        return list.map((p) => {
          const base = args.select ? pickSelect(p, args.select as Record<string, unknown>) : { ...p };
          const inc = args.include as { _count?: { select?: { comments?: { where?: RecordRow } } } } | undefined;
          if (inc?._count?.select?.comments) {
            const cWhere = inc._count.select.comments.where ?? {};
            const count = comments.filter((c) => c.postId === p.id && matchesWhere(c, cWhere)).length;
            return { ...base, _count: { comments: count } };
          }
          return base;
        });
      },

      async findUnique(args: { where: { id: string }; include?: RecordRow; select?: Record<string, unknown> }) {
        const p = posts.find((x) => x.id === args.where.id);
        if (!p) return null;
        if (args.select) return pickSelect(p, args.select);
        const out: RecordRow = { ...p };
        if (args.include?.author) {
          out.author = { displayName: findSessionName(p.sessionId) };
        }
        if ((args.include?._count as { select?: { comments?: { where?: RecordRow } } })?.select?.comments) {
          const cWhere = (args.include!._count as { select: { comments: { where?: RecordRow } } }).select.comments.where ?? {};
          out._count = { comments: comments.filter((c) => c.postId === p.id && matchesWhere(c, cWhere)).length };
        }
        return out;
      },

      async findFirst(args: { where?: RecordRow } = {}) {
        return posts.find((p) => matchesWhere(p, args.where)) ?? null;
      },

      async create(args: { data: RecordRow }) {
        const nowDate = new Date();
        const row = {
          id: nextId("post"),
          sessionId: args.data.sessionId as string,
          category: args.data.category as string,
          title: args.data.title as string,
          body: args.data.body as string,
          crisisFlag: Boolean(args.data.crisisFlag),
          hidden: Boolean(args.data.hidden),
          reportCount: 0,
          sameSituation: (args.data.sameSituation as number) ?? 0,
          encouraged: (args.data.encouraged as number) ?? 0,
          createdAt: nowDate,
          updatedAt: nowDate,
        };
        posts.unshift(row);
        return row;
      },

      async update(args: { where: { id: string }; data: RecordRow; select?: Record<string, unknown> }) {
        const p = posts.find((x) => x.id === args.where.id);
        if (!p) throw new Error("Post not found");
        const updated = applyDataUpdate(p, args.data);
        Object.assign(p, updated);
        return args.select ? pickSelect(p, args.select) : p;
      },

      async count(args: { where?: RecordRow } = {}) {
        return posts.filter((p) => matchesWhere(p, args.where)).length;
      },
    },

    comment: {
      async findMany(args: RecordRow = {}) {
        let list = comments.filter((c) => matchesWhere(c, args.where as RecordRow));
        list = sortRows(list, args.orderBy as Record<string, "asc" | "desc">);
        if (typeof args.take === "number") list = list.slice(0, args.take);
        return list.map((c) => ({
          ...c,
          ...(args.include && (args.include as RecordRow).author
            ? { author: { displayName: findSessionName(c.sessionId) } }
            : {}),
        }));
      },

      async findUnique(args: { where: { id: string }; select?: Record<string, unknown> }) {
        const c = comments.find((x) => x.id === args.where.id);
        if (!c) return null;
        return args.select ? pickSelect(c, args.select) : c;
      },

      async create(args: { data: RecordRow; include?: RecordRow }) {
        const row = {
          id: nextId("cmt"),
          postId: args.data.postId as string,
          sessionId: args.data.sessionId as string,
          body: args.data.body as string,
          crisisFlag: Boolean(args.data.crisisFlag),
          hidden: Boolean(args.data.hidden),
          reportCount: 0,
          createdAt: new Date(),
        };
        comments.push(row);
        return args.include?.author
          ? { ...row, author: { displayName: findSessionName(row.sessionId) } }
          : row;
      },

      async update(args: { where: { id: string }; data: RecordRow }) {
        const c = comments.find((x) => x.id === args.where.id);
        if (!c) throw new Error("Comment not found");
        Object.assign(c, applyDataUpdate(c, args.data));
        return c;
      },

      async count(args: { where?: RecordRow } = {}) {
        return comments.filter((c) => matchesWhere(c, args.where)).length;
      },
    },

    reaction: {
      async findMany(args: { where?: RecordRow } = {}) {
        return reactions.filter((r) => matchesWhere(r, args.where));
      },

      async findUnique(args: { where: { postId_sessionId_type: { postId: string; sessionId: string; type: string } } }) {
        const k = args.where.postId_sessionId_type;
        return (
          reactions.find(
            (r) => r.postId === k.postId && r.sessionId === k.sessionId && r.type === k.type
          ) ?? null
        );
      },

      async create(args: { data: { postId: string; sessionId: string; type: string } }) {
        const dup = reactions.find(
          (r) =>
            r.postId === args.data.postId &&
            r.sessionId === args.data.sessionId &&
            r.type === args.data.type
        );
        if (dup) throw new Error("Unique constraint failed");
        const row = { id: nextId("react"), ...args.data, createdAt: new Date() };
        reactions.push(row);
        return row;
      },

      async delete(args: { where: { id: string } }) {
        const idx = reactions.findIndex((r) => r.id === args.where.id);
        if (idx >= 0) return reactions.splice(idx, 1)[0];
        throw new Error("Reaction not found");
      },
    },

    report: {
      async create(args: { data: { postId?: string; commentId?: string; sessionId: string; reason: string } }) {
        const row = {
          id: nextId("rep"),
          postId: args.data.postId ?? null,
          commentId: args.data.commentId ?? null,
          sessionId: args.data.sessionId,
          reason: args.data.reason,
          createdAt: new Date(),
        };
        reports.push(row);
        return row;
      },

      async count(args: { where?: RecordRow } = {}) {
        return reports.filter((r) => matchesWhere(r, args.where)).length;
      },
    },

    postEmbedding: {
      async findUnique(args: { where: { postId: string } }) {
        return postEmbeddings.find((e) => e.postId === args.where.postId) ?? null;
      },

      async findMany(args: RecordRow = {}) {
        let list = postEmbeddings.filter((e) => matchesWhere(e, args.where as RecordRow));
        list = sortRows(list, args.orderBy as Record<string, "asc" | "desc">);
        if (typeof args.take === "number") list = list.slice(0, args.take);
        return list.map((e) => {
          const post = posts.find((p) => p.id === e.postId);
          return { ...e, post };
        });
      },

      async create(args: { data: { postId: string; dim: number; embedding: string; model: string } }) {
        const row = { id: nextId("emb"), ...args.data, createdAt: new Date() };
        postEmbeddings.push(row);
        return row;
      },
    },

    conversation: {
      async findFirst(args: RecordRow = {}) {
        let list = conversations.filter((c) => matchesWhere(c, args.where as RecordRow));
        list = sortRows(list, args.orderBy as Record<string, "asc" | "desc">);
        const convo = list[0];
        if (!convo) return null;
        const convoMsgs = sortRows(
          messages.filter((m) => m.conversationId === convo.id),
          { createdAt: "asc" }
        );
        return { ...convo, messages: convoMsgs };
      },

      async findUnique(args: { where: { id: string } }) {
        const convo = conversations.find((c) => c.id === args.where.id);
        if (!convo) return null;
        const convoMsgs = sortRows(
          messages.filter((m) => m.conversationId === convo.id),
          { createdAt: "asc" }
        );
        return { ...convo, messages: convoMsgs };
      },

      async create(args: { data: { sessionId: string; stage?: string } }) {
        const nowDate = new Date();
        const row = {
          id: nextId("conv"),
          sessionId: args.data.sessionId,
          stage: args.data.stage ?? "awaiting_prayer_choice",
          summary: null,
          createdAt: nowDate,
          updatedAt: nowDate,
        };
        conversations.push(row);
        return { ...row, messages: [] };
      },

      async update(args: { where: { id: string }; data: RecordRow }) {
        const c = conversations.find((x) => x.id === args.where.id);
        if (!c) throw new Error("Conversation not found");
        Object.assign(c, applyDataUpdate(c, args.data));
        return c;
      },

      async count() {
        return conversations.length;
      },
    },

    message: {
      async create(args: { data: RecordRow }) {
        const row = {
          id: nextId("msg"),
          conversationId: args.data.conversationId as string,
          role: args.data.role as string,
          content: args.data.content as string,
          offTopic: Boolean(args.data.offTopic),
          cacheHit: Boolean(args.data.cacheHit),
          createdAt: new Date(),
        };
        messages.push(row);
        return row;
      },

      async deleteMany(args: { where?: { id?: { in?: string[] } } }) {
        const ids = args.where?.id?.in;
        if (!ids) return { count: 0 };
        let removed = 0;
        for (let i = messages.length - 1; i >= 0; i -= 1) {
          if (ids.includes(messages[i].id)) {
            messages.splice(i, 1);
            removed += 1;
          }
        }
        return { count: removed };
      },
    },

    memoryNote: {
      async findUnique(args: { where: { sessionId: string } }) {
        return memoryNotes.find((m) => m.sessionId === args.where.sessionId) ?? null;
      },

      async upsert(args: { where: { sessionId: string }; update: RecordRow; create: RecordRow }) {
        const existing = memoryNotes.find((m) => m.sessionId === args.where.sessionId);
        if (existing) {
          Object.assign(existing, applyDataUpdate(existing, args.update));
          return existing;
        }
        const row = {
          id: nextId("mem"),
          sessionId: args.create.sessionId as string,
          themes: (args.create.themes as string) ?? "[]",
          concerns: (args.create.concerns as string) ?? "[]",
          prayed: Boolean(args.create.prayed),
          notes: (args.create.notes as string) ?? "",
          updatedAt: new Date(),
        };
        memoryNotes.push(row);
        return row;
      },

      async deleteMany(args: { where?: { sessionId?: string } }) {
        const sid = args.where?.sessionId;
        if (!sid) return { count: 0 };
        let removed = 0;
        for (let i = memoryNotes.length - 1; i >= 0; i -= 1) {
          if (memoryNotes[i].sessionId === sid) {
            memoryNotes.splice(i, 1);
            removed += 1;
          }
        }
        return { count: removed };
      },
    },

    cachedResponse: {
      async findUnique(args: { where: { id: string } }) {
        return cachedResponses.find((c) => c.id === args.where.id) ?? null;
      },

      async findMany(args: RecordRow = {}) {
        let list = cachedResponses.filter((c) => matchesWhere(c, args.where as RecordRow));
        list = sortRows(list, args.orderBy as Record<string, "asc" | "desc">);
        if (typeof args.take === "number") list = list.slice(0, args.take);
        if (args.select) return list.map((c) => pickSelect(c, args.select as Record<string, unknown>));
        return list;
      },

      async create(args: { data: RecordRow }) {
        const nowDate = new Date();
        const row = {
          id: nextId("cache"),
          normalized: args.data.normalized as string,
          dim: args.data.dim as number,
          embedding: args.data.embedding as string,
          model: (args.data.model as string) ?? "local-hash-v1",
          response: args.data.response as string,
          language: (args.data.language as string) ?? "en",
          themeTags: (args.data.themeTags as string) ?? "[]",
          qualityScore: (args.data.qualityScore as number) ?? 0,
          votes: (args.data.votes as number) ?? 0,
          hits: (args.data.hits as number) ?? 0,
          active: args.data.active !== undefined ? Boolean(args.data.active) : true,
          createdAt: nowDate,
          lastHitAt: nowDate,
        };
        cachedResponses.unshift(row);
        return row;
      },

      async update(args: { where: { id: string }; data: RecordRow }) {
        const c = cachedResponses.find((x) => x.id === args.where.id);
        if (!c) throw new Error("CachedResponse not found");
        Object.assign(c, applyDataUpdate(c, args.data));
        return c;
      },

      async updateMany(args: { where: RecordRow; data: RecordRow }) {
        let count = 0;
        for (const c of cachedResponses) {
          if (matchesWhere(c, args.where)) {
            Object.assign(c, applyDataUpdate(c, args.data));
            count += 1;
          }
        }
        return { count };
      },

      async count(args: { where?: RecordRow } = {}) {
        return cachedResponses.filter((c) => matchesWhere(c, args.where)).length;
      },
    },

    track: {
      async findMany(args: RecordRow = {}) {
        let list = tracks.filter((t) => matchesWhere(t, args.where as RecordRow));
        list = sortRows(list, args.orderBy as Array<Record<string, "asc" | "desc">>);
        if (typeof args.take === "number") list = list.slice(0, args.take);
        return list;
      },

      async findFirst(args: RecordRow = {}) {
        let list = tracks.filter((t) => matchesWhere(t, args.where as RecordRow));
        list = sortRows(list, args.orderBy as Record<string, "asc" | "desc">);
        return list[0] ?? null;
      },

      async findUnique(args: { where: { id: string }; select?: Record<string, unknown> }) {
        const t = tracks.find((x) => x.id === args.where.id);
        if (!t) return null;
        return args.select ? pickSelect(t, args.select) : t;
      },

      async create(args: { data: RecordRow }) {
        const row = {
          id: nextId("track"),
          title: args.data.title as string,
          description: (args.data.description as string) ?? "",
          lyrics: (args.data.lyrics as string) ?? "",
          scripture: (args.data.scripture as string) ?? "",
          audioUrl: args.data.audioUrl as string,
          coverUrl: (args.data.coverUrl as string) ?? "",
          durationSec: (args.data.durationSec as number) ?? 0,
          playCount: (args.data.playCount as number) ?? 0,
          album: (args.data.album as string) ?? "Singles",
          trackOrder: (args.data.trackOrder as number) ?? tracks.length,
          published: args.data.published !== undefined ? Boolean(args.data.published) : true,
          createdAt: new Date(),
        };
        tracks.push(row);
        return row;
      },

      async update(args: { where: { id: string }; data: RecordRow; select?: Record<string, unknown> }) {
        const t = tracks.find((x) => x.id === args.where.id);
        if (!t) throw new Error("Track not found");
        Object.assign(t, applyDataUpdate(t, args.data));
        return args.select ? pickSelect(t, args.select) : t;
      },

      async count() {
        return tracks.length;
      },
    },

    playlist: {
      async upsert(args: { where: { name: string }; update: RecordRow; create: RecordRow }) {
        const existing = playlists.find((p) => p.name === args.where.name);
        if (existing) {
          Object.assign(existing, applyDataUpdate(existing, args.update));
          return existing;
        }
        const row = {
          id: nextId("pl"),
          name: args.create.name as string,
          description: (args.create.description as string) ?? "",
          createdAt: new Date(),
        };
        playlists.push(row);
        return row;
      },
    },

    playlistItem: {
      async create(args: { data: { playlistId: string; trackId: string; position?: number } }) {
        const row = {
          id: nextId("pli"),
          playlistId: args.data.playlistId,
          trackId: args.data.trackId,
          position: args.data.position ?? 0,
        };
        playlistItems.push(row);
        return row;
      },
    },

    moderationLog: {
      async findMany(args: RecordRow = {}) {
        let list = sortRows(moderationLogs, args.orderBy as Record<string, "asc" | "desc">);
        if (typeof args.take === "number") list = list.slice(0, args.take);
        return list;
      },

      async create(args: { data: RecordRow }) {
        const row = {
          id: nextId("mod"),
          targetType: args.data.targetType as string,
          targetId: args.data.targetId as string,
          action: args.data.action as string,
          scores: (args.data.scores as string) ?? "{}",
          reason: (args.data.reason as string) ?? "",
          createdAt: new Date(),
        };
        moderationLogs.unshift(row);
        return row;
      },

      async updateMany(args: { where: RecordRow; data: RecordRow }) {
        let count = 0;
        for (const log of moderationLogs) {
          if (matchesWhere(log, args.where)) {
            Object.assign(log, applyDataUpdate(log, args.data));
            count += 1;
          }
        }
        return { count };
      },
    },

    usageStat: {
      async findMany() {
        return [...usageStats];
      },

      async upsert(args: { where: { key: string }; update: RecordRow; create: { key: string; value: number } }) {
        const existing = usageStats.find((u) => u.key === args.where.key);
        if (existing) {
          Object.assign(existing, applyDataUpdate(existing, args.update));
          return existing;
        }
        const row = {
          id: nextId("stat"),
          key: args.create.key,
          value: args.create.value,
          updatedAt: new Date(),
        };
        usageStats.push(row);
        return row;
      },
    },
  };

  return dummy as unknown as PrismaClient;
}
