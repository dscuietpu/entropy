import { env } from "../config/env";
import { HttpError } from "../utils/http-error";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 25_000;

export interface ChatInput {
  message: string;
  context?: string;
}

export interface SmartSearchQueryResult {
  cleanedQuery: string;
  intent: string;
  entities: Record<string, string>;
}

type OpenRouterChatRole = "system" | "user" | "assistant";

interface OpenRouterChatMessage {
  role: OpenRouterChatRole;
  content: string;
}

interface OpenRouterChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string };
}

/** Minimal OpenRouter client — hackathon-friendly, single responsibility. */
export class OpenRouterProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async completeChat(messages: OpenRouterChatMessage[], temperature = 0.2): Promise<string> {
    const response = await fetchWithTimeout(
      OPENROUTER_CHAT_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          temperature,
          messages,
        }),
      },
      REQUEST_TIMEOUT_MS
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new HttpError(502, `OpenRouter request failed: ${detail || response.statusText}`);
    }

    const json = (await response.json()) as OpenRouterChatCompletionResponse;
    if (json.error?.message) {
      throw new HttpError(502, `OpenRouter error: ${json.error.message}`);
    }

    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new HttpError(502, "OpenRouter returned an empty response");
    }

    return content.trim();
  }
}

const getOpenRouterOrThrow = (): OpenRouterProvider => {
  const key = env.openRouterApiKey;
  if (!key) {
    throw new HttpError(503, "OPENROUTER_API_KEY is not configured");
  }
  return new OpenRouterProvider(key, env.openRouterModel);
};

const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new HttpError(504, "AI request timed out");
    }
    if (err instanceof HttpError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : "Network error";
    throw new HttpError(502, `AI request failed: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
};

const callOpenRouter = async (opts: {
  system: string;
  user: string;
  temperature?: number;
}): Promise<string> => {
  const provider = getOpenRouterOrThrow();
  return provider.completeChat(
    [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    opts.temperature ?? 0.2
  );
};

const extractJsonPayload = (raw: string): string => {
  const trimmed = raw.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fence?.[1]) {
    return fence[1].trim();
  }
  return trimmed;
};

export const summarizeReviews = async (reviewTexts: string[]): Promise<string> => {
  const texts = (reviewTexts ?? [])
    .map((t) => (t ?? "").toString().trim())
    .filter(Boolean);
  if (!texts.length) {
    throw new HttpError(400, "reviewTexts must be a non-empty array of strings");
  }

  const system =
    "You summarize healthcare facility reviews for a dashboard. Output only concise bullet points (use '- ' lines). No title, no preamble.";
  const user = `Summarize these reviews into 4–7 bullet points:\n\n${texts
    .slice(0, 50)
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n")}`;

  return callOpenRouter({ system, user, temperature: 0.3 });
};

export const chat = async (input: ChatInput): Promise<string> => {
  const message = (input.message ?? "").trim();
  if (!message) {
    throw new HttpError(400, "message is required");
  }

  const context = (input.context ?? "").trim();
  const system =
    "You are a helpful assistant for hospital and equipment coordination. Be brief and actionable. If critical information is missing, ask one short clarifying question.";
  const user = context ? `Context:\n${context}\n\nUser message:\n${message}` : message;

  return callOpenRouter({ system, user, temperature: 0.4 });
};

export const smartSearchQuery = async (query: string | undefined): Promise<SmartSearchQueryResult> => {
  const q = (query ?? "").trim();
  if (!q) {
    throw new HttpError(400, "query is required");
  }

  const system =
    "You help parse natural language into search intent for a hospital/equipment/medical directory. Reply with ONLY valid JSON, no markdown.";
  const user = `User query: "${q}"\n\nReturn JSON: {"cleanedQuery": string, "intent": string, "entities": object with string values only}.`;

  let raw: string;
  try {
    raw = await callOpenRouter({ system, user, temperature: 0.1 });
  } catch {
    return { cleanedQuery: q, intent: "search", entities: {} };
  }

  try {
    const parsed = JSON.parse(extractJsonPayload(raw)) as Record<string, unknown>;
    const cleanedQuery = String(parsed.cleanedQuery ?? "").trim();
    const intent = String(parsed.intent ?? "").trim();
    const rawEntities = parsed.entities;

    const entities: Record<string, string> = {};
    if (rawEntities && typeof rawEntities === "object" && !Array.isArray(rawEntities)) {
      for (const [k, v] of Object.entries(rawEntities)) {
        if (typeof v === "string" && v.trim()) {
          entities[k] = v.trim();
        }
      }
    }

    if (!cleanedQuery || !intent) {
      return { cleanedQuery: q, intent: "search", entities: {} };
    }

    return { cleanedQuery, intent, entities };
  } catch {
    return { cleanedQuery: q, intent: "search", entities: {} };
  }
};
