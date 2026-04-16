import { FilterQuery, isValidObjectId } from "mongoose";

import {
  EQUIPMENT_STATUSES,
  Equipment,
  EquipmentStatus,
  HOSPITAL_AVAILABILITY_STATUSES,
  Hospital,
  HospitalAvailabilityStatus,
  MedicalShop,
} from "../models";
import { embed } from "./embedding.service";
import { cosineSimilarity } from "../utils/cosineSimilarity";
import { HttpError } from "../utils/http-error";

interface HospitalSemanticSearchInput {
  query: string;
  filters?: {
    city?: string;
    state?: string;
    availabilityStatus?: string;
  };
  topK?: number;
  candidateLimit?: number;
}

interface EquipmentSemanticSearchInput {
  query: string;
  filters?: {
    hospitalId?: string;
    status?: string;
    type?: string;
    hospitalSection?: string;
  };
  topK?: number;
  candidateLimit?: number;
}

interface MedicalShopSemanticSearchInput {
  query: string;
  filters?: {
    city?: string;
    state?: string;
    area?: string;
  };
  topK?: number;
  candidateLimit?: number;
}

const omitEmbeddingFields = (doc: Record<string, unknown>): Record<string, unknown> => {
  const { embedding, embeddingText, ...rest } = doc;
  return rest;
};

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const validateHospitalAvailability = (value: string): HospitalAvailabilityStatus => {
  if (!HOSPITAL_AVAILABILITY_STATUSES.includes(value as HospitalAvailabilityStatus)) {
    throw new HttpError(400, "Invalid availabilityStatus");
  }
  return value as HospitalAvailabilityStatus;
};

const validateEquipmentStatus = (value: string): EquipmentStatus => {
  if (!EQUIPMENT_STATUSES.includes(value as EquipmentStatus)) {
    throw new HttpError(400, "Invalid status");
  }
  return value as EquipmentStatus;
};

export const semanticSearchHospitals = async (input: HospitalSemanticSearchInput): Promise<
  Array<{
    similarity: number;
    hospital: Record<string, unknown>;
  }>
> => {
  const queryText = (input.query ?? "").trim();
  if (!queryText) {
    throw new HttpError(400, "query is required");
  }

  const topK = Math.min(toPositiveInt(input.topK, 10), 50);
  const candidateLimit = Math.min(toPositiveInt(input.candidateLimit, 200), 1000);

  const mongoQuery: FilterQuery<Record<string, unknown>> = {
    embedding: { $exists: true, $ne: [] },
  };

  const filters = input.filters ?? {};
  if (filters.city) {
    mongoQuery.city = { $regex: filters.city.trim(), $options: "i" };
  }
  if (filters.state) {
    mongoQuery.state = { $regex: filters.state.trim(), $options: "i" };
  }
  if (filters.availabilityStatus) {
    mongoQuery.availabilityStatus = validateHospitalAvailability(filters.availabilityStatus);
  }

  const queryEmbedding = await embed(queryText);

  const candidates = await Hospital.find(mongoQuery)
    .select("-embeddingText") // keep response light; embedding still selected for scoring
    .limit(candidateLimit)
    .lean();

  const scored: Array<{ similarity: number; hospital: Record<string, unknown> }> = [];
  for (const hospital of candidates as Array<Record<string, unknown>>) {
    const vector = (hospital.embedding as unknown as number[]) ?? [];
    if (!Array.isArray(vector) || vector.length === 0) {
      continue;
    }
    scored.push({
      similarity: cosineSimilarity(queryEmbedding, vector),
      hospital: omitEmbeddingFields(hospital),
    });
  }

  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
};

export const semanticSearchEquipment = async (input: EquipmentSemanticSearchInput): Promise<
  Array<{
    similarity: number;
    equipment: Record<string, unknown>;
  }>
> => {
  const queryText = (input.query ?? "").trim();
  if (!queryText) {
    throw new HttpError(400, "query is required");
  }

  const topK = Math.min(toPositiveInt(input.topK, 10), 50);
  const candidateLimit = Math.min(toPositiveInt(input.candidateLimit, 200), 1000);

  const mongoQuery: FilterQuery<Record<string, unknown>> = {
    embedding: { $exists: true, $ne: [] },
  };

  const filters = input.filters ?? {};
  if (filters.hospitalId) {
    if (!isValidObjectId(filters.hospitalId)) {
      throw new HttpError(400, "Invalid hospitalId");
    }
    mongoQuery.hospitalId = filters.hospitalId;
  }
  if (filters.status) {
    mongoQuery.status = validateEquipmentStatus(filters.status);
  }
  if (filters.type) {
    mongoQuery.type = { $regex: filters.type.trim(), $options: "i" };
  }
  if (filters.hospitalSection) {
    mongoQuery.hospitalSection = { $regex: filters.hospitalSection.trim(), $options: "i" };
  }

  const queryEmbedding = await embed(queryText);

  const candidates = await Equipment.find(mongoQuery)
    .select("-embeddingText")
    .populate("hospitalId", "name city state contactNumber availabilityStatus")
    .populate("assignedTo", "name specialization department availability")
    .limit(candidateLimit)
    .lean();

  const scored: Array<{ similarity: number; equipment: Record<string, unknown> }> = [];
  for (const equipment of candidates as Array<Record<string, unknown>>) {
    const vector = (equipment.embedding as unknown as number[]) ?? [];
    if (!Array.isArray(vector) || vector.length === 0) {
      continue;
    }
    scored.push({
      similarity: cosineSimilarity(queryEmbedding, vector),
      equipment: omitEmbeddingFields(equipment),
    });
  }

  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
};

export const semanticSearchMedicalShops = async (
  input: MedicalShopSemanticSearchInput
): Promise<
  Array<{
    similarity: number;
    medicalShop: Record<string, unknown>;
  }>
> => {
  const queryText = (input.query ?? "").trim();
  if (!queryText) {
    throw new HttpError(400, "query is required");
  }

  const topK = Math.min(toPositiveInt(input.topK, 10), 50);
  const candidateLimit = Math.min(toPositiveInt(input.candidateLimit, 200), 1000);

  const mongoQuery: FilterQuery<Record<string, unknown>> = {
    embedding: { $exists: true, $ne: [] },
  };

  const filters = input.filters ?? {};
  if (filters.city) {
    mongoQuery.city = { $regex: filters.city.trim(), $options: "i" };
  }
  if (filters.state) {
    mongoQuery.state = { $regex: filters.state.trim(), $options: "i" };
  }
  if (filters.area) {
    mongoQuery.area = { $regex: filters.area.trim(), $options: "i" };
  }

  const queryEmbedding = await embed(queryText);

  const candidates = await MedicalShop.find(mongoQuery)
    .select("-embeddingText")
    .limit(candidateLimit)
    .lean();

  const scored: Array<{ similarity: number; medicalShop: Record<string, unknown> }> = [];
  for (const shop of candidates as Array<Record<string, unknown>>) {
    const vector = (shop.embedding as unknown as number[]) ?? [];
    if (!Array.isArray(vector) || vector.length === 0) {
      continue;
    }
    scored.push({
      similarity: cosineSimilarity(queryEmbedding, vector),
      medicalShop: omitEmbeddingFields(shop),
    });
  }

  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
};

