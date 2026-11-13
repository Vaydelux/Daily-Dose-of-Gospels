import "server-only";

/**
 * AI provider abstraction (OpenAI).
 *
 * Env:
 *   OPENAI_API_KEY            — required for chat completions & embeddings
 *   OPENAI_MODEL              — default: gpt-4o-mini
 *   OPENAI_EMBEDDING_MODEL    — default: text-embedding-3-small
 *   OPENAI_BASE_URL           — optional (proxies / compatible gateways)
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const OPENAI_BASE = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

export function aiBackend(): "openai" | "unconfigured" {
  return OPENAI_KEY ? "openai" : "unconfigured";
}

export function chatModelName(): string {
  return OPENAI_KEY ? OPENAI_MODEL : "unconfigured";
}

export function embeddingModelName(): string {
  return OPENAI_KEY ? OPENAI_EMBEDDING_MODEL : "local-hash-v1";
}

export function embeddingDim(): number {
  return OPENAI_KEY ? 1536 : 256;
}

type OpenAIChunk = { choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }> };

async function openaiChat(body: Record<string, unknown>): Promise<Response> {
  if (!OPENAI_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(body),
  });
}

// ─── Public API ────────────────────────────────────────────────────────────────

export type ChatResult = { content: string; tokensIn: number; tokensOut: number };

export async function chatComplete(
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number; json?: boolean } = {}
): Promise<ChatResult> {
  const maxTokens = opts.maxTokens ?? 700;
  const temperature = opts.temperature ?? 0.7;

  const res = await openaiChat({
    model: OPENAI_MODEL,
    messages,
    max_tokens: maxTokens,
    temperature,
    ...(opts.json ? { response_format: { type: "json_object" } } : {}),
  });
  if (!res.ok) throw new Error(`OpenAI chat failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
  };
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    tokensIn: data.usage?.prompt_tokens ?? estimateTokens(messages),
    tokensOut: data.usage?.completion_tokens ?? 0,
  };
}

export async function chatStream(
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<AsyncGenerator<string>> {
  const maxTokens = opts.maxTokens ?? 700;
  const temperature = opts.temperature ?? 0.7;

  const res = await openaiChat({
    model: OPENAI_MODEL,
    messages,
    max_tokens: maxTokens,
    temperature,
    stream: true,
  });
  if (!res.ok || !res.body) throw new Error(`OpenAI stream failed: ${res.status}`);
  return sseToDeltas(res.body);
}

async function* sseToDeltas(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const parsed = JSON.parse(payload) as OpenAIChunk;
        const delta = parsed?.choices?.[0]?.delta?.content ?? "";
        if (delta) yield delta;
      } catch {
        // ignore malformed chunk
      }
    }
  }
}

export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (OPENAI_KEY) {
    const res = await fetch(`${OPENAI_BASE}/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: OPENAI_EMBEDDING_MODEL, input: texts }),
    });
    if (!res.ok) throw new Error(`OpenAI embeddings failed: ${res.status}`);
    const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
    return data.data.map((d) => d.embedding);
  }
  return texts.map(localEmbed);
}

// ─── Token estimation (~4 chars/token heuristic) ───────────────────────────────

export function estimateText(text: string): number {
  return Math.ceil((text || "").length / 4);
}

export function estimateTokens(messages: ChatMessage[]): number {
  return messages.reduce((sum, m) => sum + estimateText(m.content) + 4, 0);
}

// ─── Local deterministic embedding (dev/unconfigured fallback, 256-dim) ────────

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

export function localEmbed(text: string): number[] {
  const vec = new Array<number>(LOCAL_DIM).fill(0);
  const tokens = tokenize(text || "");
  if (tokens.length === 0) return vec;
  for (const token of tokens) {
    vec[hashToken(token) % LOCAL_DIM] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}
