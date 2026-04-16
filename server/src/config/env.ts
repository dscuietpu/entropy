import dotenv from "dotenv";

dotenv.config();

type NodeEnv = "development" | "production" | "test";

const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`[env] Missing required environment variable: ${key}`);
  }
  return value;
};

const getOptionalEnv = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value || undefined;
};

const parsePort = (value: string | undefined): number => {
  if (!value) return 5000;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error("[env] Invalid PORT. Expected an integer between 1 and 65535.");
  }
  return parsed;
};

const rawNodeEnv = (process.env.NODE_ENV?.trim() || "development") as NodeEnv;
const nodeEnv: NodeEnv = ["development", "production", "test"].includes(rawNodeEnv)
  ? rawNodeEnv
  : "development";

export interface EnvConfig {
  port: number;
  nodeEnv: NodeEnv;
  mongoUri: string;
  jwtSecret: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  hfApiKey?: string;
  hfEmbeddingModel: string;
  openRouterApiKey?: string;
  openRouterModel: string;
}

export const env: EnvConfig = {
  port: parsePort(process.env.PORT),
  nodeEnv,
  mongoUri: getRequiredEnv("MONGO_URI"),
  jwtSecret: getRequiredEnv("JWT_SECRET"),
  cloudinaryCloudName: getRequiredEnv("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: getRequiredEnv("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: getRequiredEnv("CLOUDINARY_API_SECRET"),
  hfApiKey: getOptionalEnv("HF_API_KEY"),
  hfEmbeddingModel: getOptionalEnv("HF_EMBEDDING_MODEL") || "sentence-transformers/all-MiniLM-L6-v2",
  openRouterApiKey: getOptionalEnv("OPENROUTER_API_KEY"),
  openRouterModel: getOptionalEnv("OPENROUTER_MODEL") || "google/gemini-2.0-flash-lite",
};
