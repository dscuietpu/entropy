import { env } from "../config/env";
import { HttpError } from "../utils/http-error";

const HF_API_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction";

const meanPool = (tokenEmbeddings: number[][]): number[] => {
  if (!tokenEmbeddings.length) {
    return [];
  }

  const dim = tokenEmbeddings[0]?.length ?? 0;
  if (!dim) {
    return [];
  }

  const pooled = new Array<number>(dim).fill(0);
  let count = 0;

  for (const token of tokenEmbeddings) {
    if (!Array.isArray(token) || token.length !== dim) {
      continue;
    }
    for (let i = 0; i < dim; i += 1) {
      pooled[i] += token[i];
    }
    count += 1;
  }

  if (count === 0) {
    return [];
  }

  for (let i = 0; i < dim; i += 1) {
    pooled[i] /= count;
  }

  return pooled;
};

const l2Normalize = (vector: number[]): number[] => {
  let sumSq = 0;
  for (const v of vector) {
    sumSq += v * v;
  }
  const norm = Math.sqrt(sumSq);
  if (!norm) {
    return vector;
  }
  return vector.map((v) => v / norm);
};

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === "number");

const isNumberMatrix = (value: unknown): value is number[][] =>
  Array.isArray(value) && value.length > 0 && value.every((row) => isNumberArray(row));

const getNestedCandidate = (value: unknown): unknown => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  return record.embeddings ?? record.embedding ?? record.data ?? record.vector ?? record.output;
};

const extractEmbeddingFromResponse = (data: unknown): number[] => {
  // Common HF shapes:
  // - number[] (already pooled)
  // - number[][] (tokens x dim)
  // - number[][][] (batch x tokens x dim) -> take first item
  if (isNumberArray(data)) {
    return data;
  }

  if (isNumberMatrix(data)) {
    return meanPool(data);
  }

  if (Array.isArray(data) && data.length > 0 && isNumberMatrix(data[0])) {
    return meanPool(data[0] as number[][]);
  }

  const nested = getNestedCandidate(data);
  if (nested !== undefined) {
    return extractEmbeddingFromResponse(nested);
  }

  return [];
};

export const embed = async (text: string): Promise<number[]> => {
  const input = text.trim();
  if (!input) {
    return [];
  }

  if (!env.hfApiKey) {
    throw new HttpError(500, "HF_API_KEY is not configured");
  }

  const model = env.hfEmbeddingModel;
  const url = `${HF_API_URL}/${encodeURIComponent(model)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.hfApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: input }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new HttpError(502, `Hugging Face embedding request failed: ${detail || response.statusText}`);
  }

  const data = (await response.json()) as unknown;
  const vector = extractEmbeddingFromResponse(data);

  if (!vector.length) {
    throw new HttpError(502, "Hugging Face returned an unsupported embedding shape");
  }

  return l2Normalize(vector);
};

/** Never throws; returns `[]` when text is empty or Hugging Face is unavailable / fails. */
export const embedBestEffort = async (text: string): Promise<number[]> => {
  try {
    return await embed(text);
  } catch {
    return [];
  }
};

