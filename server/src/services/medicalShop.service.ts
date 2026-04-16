import { FilterQuery, isValidObjectId } from "mongoose";

import { IMedicalShop, MedicalShop } from "../models";
import { HttpError } from "../utils/http-error";
import { buildMedicalShopEmbeddingText } from "../utils/buildEmbeddingText";
import {
  attachRegexFilter,
  buildPaginationMeta,
  makeContainsRegex,
  parsePagination,
  parseSort,
} from "../utils/query-builder";
import { embedBestEffort } from "./embedding.service";

interface MedicalShopFilters {
  search?: string;
  city?: string;
  state?: string;
  area?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  order?: string;
}

interface CreateMedicalShopPayload {
  name?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location?: { lat?: number; lng?: number };
  contactNumber?: string;
  availableMedicines?: string[];
  embeddingText?: string;
  embedding?: number[];
}

interface UpdateMedicalShopPayload extends CreateMedicalShopPayload {}

interface MedicalShopListResponse {
  data: IMedicalShop[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const sanitizeArray = (arr?: string[]): string[] =>
  (arr ?? []).map((item) => item.trim()).filter(Boolean);

const validateLocation = (location?: {
  lat?: number;
  lng?: number;
}): { lat: number; lng: number } => {
  if (location?.lat === undefined || location?.lng === undefined) {
    throw new HttpError(400, "location.lat and location.lng are required");
  }

  if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
    throw new HttpError(400, "location.lat and location.lng must be valid numbers");
  }

  return { lat: location.lat, lng: location.lng };
};

export const getMedicalShops = async (
  filters: MedicalShopFilters
): Promise<MedicalShopListResponse> => {
  const { page, limit, skip } = parsePagination({
    page: filters.page,
    limit: filters.limit,
  });
  const sort = parseSort({
    sortBy: filters.sortBy,
    order: filters.order,
    allowedSorts: {
      name: "name",
      area: "area",
      city: "city",
      state: "state",
      createdAt: "createdAt",
    },
    defaultSort: { createdAt: -1 },
  });

  const query: FilterQuery<IMedicalShop> = {};

  if (filters.search?.trim()) {
    const searchRegex = makeContainsRegex(filters.search) as RegExp;
    query.$or = [
      { name: { $regex: searchRegex } },
      { area: { $regex: searchRegex } },
      { availableMedicines: { $regex: searchRegex } },
    ];
  }

  attachRegexFilter(query, "city", filters.city);
  attachRegexFilter(query, "state", filters.state);
  attachRegexFilter(query, "area", filters.area);

  const [shops, total] = await Promise.all([
    MedicalShop.find(query).sort(sort).skip(skip).limit(limit).lean(),
    MedicalShop.countDocuments(query),
  ]);

  return {
    data: shops,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getMedicalShopById = async (id: string): Promise<IMedicalShop> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid medical shop id");
  }

  const shop = await MedicalShop.findById(id).lean();
  if (!shop) {
    throw new HttpError(404, "Medical shop not found");
  }

  return shop;
};

export const createMedicalShop = async (
  payload: CreateMedicalShopPayload
): Promise<IMedicalShop> => {
  const requiredFields = ["name", "area", "city", "state", "contactNumber"] as const;

  requiredFields.forEach((field) => {
    if (!payload[field]) {
      throw new HttpError(400, `${field} is required`);
    }
  });

  const location = validateLocation(payload.location);

  const embeddingTextRaw =
    payload.embeddingText?.trim() ||
    buildMedicalShopEmbeddingText({
      name: payload.name as string,
      area: payload.area,
      city: payload.city,
      state: payload.state,
      pincode: payload.pincode,
      availableMedicines: payload.availableMedicines,
    });

  const embeddingText = embeddingTextRaw.trim() || (payload.name as string).trim();

  const hasExplicitEmbedding = Array.isArray(payload.embedding) && payload.embedding.length > 0;
  let embedding: number[] = hasExplicitEmbedding ? payload.embedding! : [];
  if (!embedding.length) {
    embedding = await embedBestEffort(embeddingText);
  }

  const shop = await MedicalShop.create({
    name: payload.name?.trim(),
    area: payload.area?.trim(),
    city: payload.city?.trim(),
    state: payload.state?.trim(),
    pincode: payload.pincode?.trim(),
    location,
    contactNumber: payload.contactNumber?.trim(),
    availableMedicines: sanitizeArray(payload.availableMedicines),
    embeddingText,
    embedding,
  });

  return shop.toObject();
};

export const updateMedicalShop = async (
  id: string,
  payload: UpdateMedicalShopPayload
): Promise<IMedicalShop> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid medical shop id");
  }

  const shop = await MedicalShop.findById(id);
  if (!shop) {
    throw new HttpError(404, "Medical shop not found");
  }

  const hasUpdateField = [
    payload.name,
    payload.area,
    payload.city,
    payload.state,
    payload.pincode,
    payload.location,
    payload.contactNumber,
    payload.availableMedicines,
    payload.embeddingText,
    payload.embedding,
  ].some((value) => value !== undefined);

  if (!hasUpdateField) {
    throw new HttpError(400, "No valid update fields provided");
  }

  if (payload.name !== undefined) {
    const value = payload.name.trim();
    if (!value) throw new HttpError(400, "name cannot be empty");
    shop.name = value;
  }
  if (payload.area !== undefined) {
    const value = payload.area.trim();
    if (!value) throw new HttpError(400, "area cannot be empty");
    shop.area = value;
  }
  if (payload.city !== undefined) {
    const value = payload.city.trim();
    if (!value) throw new HttpError(400, "city cannot be empty");
    shop.city = value;
  }
  if (payload.state !== undefined) {
    const value = payload.state.trim();
    if (!value) throw new HttpError(400, "state cannot be empty");
    shop.state = value;
  }
  if (payload.pincode !== undefined) {
    shop.pincode = payload.pincode.trim() || undefined;
  }
  if (payload.location !== undefined) {
    shop.location = validateLocation(payload.location);
  }
  if (payload.contactNumber !== undefined) {
    const value = payload.contactNumber.trim();
    if (!value) throw new HttpError(400, "contactNumber cannot be empty");
    shop.contactNumber = value;
  }
  if (payload.availableMedicines !== undefined) {
    shop.availableMedicines = sanitizeArray(payload.availableMedicines);
  }
  if (payload.embeddingText !== undefined) {
    const value = payload.embeddingText.trim();
    if (!value) throw new HttpError(400, "embeddingText cannot be empty");
    shop.embeddingText = value;
  }
  if (payload.embedding !== undefined) {
    shop.embedding = payload.embedding;
  }

  const shouldRebuildEmbeddingText =
    payload.embeddingText === undefined &&
    (payload.name !== undefined ||
      payload.area !== undefined ||
      payload.city !== undefined ||
      payload.state !== undefined ||
      payload.pincode !== undefined ||
      payload.availableMedicines !== undefined);

  if (shouldRebuildEmbeddingText) {
    const rebuilt = buildMedicalShopEmbeddingText({
      name: shop.name,
      area: shop.area,
      city: shop.city,
      state: shop.state,
      pincode: shop.pincode,
      availableMedicines: shop.availableMedicines,
    }).trim();
    shop.embeddingText = rebuilt || shop.name;
  }

  const shouldReEmbed =
    payload.embedding === undefined &&
    (payload.embeddingText !== undefined || shouldRebuildEmbeddingText);

  if (shouldReEmbed && shop.embeddingText) {
    shop.embedding = await embedBestEffort(shop.embeddingText);
  }

  await shop.save();
  return shop.toObject();
};

export const deleteMedicalShop = async (id: string): Promise<void> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid medical shop id");
  }

  const shop = await MedicalShop.findById(id);
  if (!shop) {
    throw new HttpError(404, "Medical shop not found");
  }

  await shop.deleteOne();
};

