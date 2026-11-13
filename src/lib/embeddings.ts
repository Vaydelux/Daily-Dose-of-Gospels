import "server-only";
import { embed, embeddingDim, embeddingModelName } from "@/lib/ai/provider";

/**
 * Vector utilities — cosine similarity computed in application code.
 *
 * This is the spec-sanctioned fallback for environments without pgvector
 * (including the SQLite dev database). Works identically on Postgres; the
 * pgvector upgrade path is documented in prisma/schema.prisma and README.
 */

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function parseEmbedding(json: string): number[] {
  try {
    const arr = JSON.parse(json) as number[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function embedOne(text: string): Promise<{ vec: number[]; dim: number; model: string }> {
  const [vec] = await embed([text]);
  return { vec, dim: vec?.length ?? embeddingDim(), model: embeddingModelName() };
}

// Compatible-model guard: embeddings from different models must not be compared.
export function isCompatibleModel(storedModel: string): boolean {
  return storedModel === embeddingModelName();
}
