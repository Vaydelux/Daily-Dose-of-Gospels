import { z } from "zod";

export const POST_CATEGORIES = ["TESTIMONY", "PRAYER", "STRUGGLES", "ENCOURAGEMENT", "REFLECTION"] as const;

export const reactionTypeSchema = z.enum(["SAME_SITUATION", "ENCOURAGED"]);

export const createPostSchema = z.object({
  category: z.enum(POST_CATEGORIES),
  title: z.string().trim().min(4, "Please write a slightly longer title").max(120),
  body: z.string().trim().min(10, "Please share a little more (at least 10 characters)").max(4000),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(2, "Please write a slightly longer reply").max(2000),
});

export const reportSchema = z.object({
  reason: z.string().trim().min(3).max(300),
  commentId: z.string().cuid().optional(),
});

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Please type a message").max(3000),
  conversationId: z.string().cuid().optional(),
  /** Quick-reply chips: the prayer-choice buttons come through as normal text. */
});

export const feedbackSchema = z.object({
  cachedResponseId: z.string().min(6).max(80),
  vote: z.union([z.literal(1), z.literal(-1)]),
});

export const trackSchema = z.object({
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(1000).default(""),
  lyrics: z.string().trim().max(8000).default(""),
  scripture: z.string().trim().max(140).default(""),
  album: z.string().trim().max(120).default("Singles"),
  audioUrl: z.string().min(1),
  coverUrl: z.string().default(""),
  durationSec: z.number().int().min(0).max(3600).default(0),
});

export type PostCategory = (typeof POST_CATEGORIES)[number];
