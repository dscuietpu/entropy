import { FilterQuery, Types, isValidObjectId } from "mongoose";

import {
  Ambulance,
  Appointment,
  Doctor,
  Equipment,
  HOSPITAL_AVAILABILITY_STATUSES,
  Hospital,
  HospitalAvailabilityStatus,
  IHospital,
  Issue,
  Review,
} from "../models";
import { HttpError } from "../utils/http-error";
import { buildHospitalEmbeddingText } from "../utils/buildEmbeddingText";
import {
  attachRegexFilter,
  buildPaginationMeta,
  parseCsvParam,
  parsePagination,
  parseSort,
} from "../utils/query-builder";
import { embedBestEffort } from "./embedding.service";

interface HospitalFilters {
  search?: string;
  city?: string;
  state?: string;
  availabilityStatus?: string;
  specialties?: string;
  facilities?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  order?: string;
}

interface CreateHospitalPayload {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location?: { lat?: number; lng?: number };
  specialties?: string[];
  facilities?: string[];
  departments?: string[];
  contactNumber?: string;
  emergencyContact?: string;
  ambulanceCount?: number;
  averageRating?: number;
  availabilityStatus?: string;
  embeddingText?: string;
  embedding?: number[];
}

interface UpdateHospitalPayload extends CreateHospitalPayload {}

interface HospitalListResponse {
  data: IHospital[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const sanitizeArray = (arr?: string[]): string[] =>
  (arr ?? []).map((item) => item.trim()).filter(Boolean);

const validateAvailabilityStatus = (availabilityStatus: string): HospitalAvailabilityStatus => {
  if (!HOSPITAL_AVAILABILITY_STATUSES.includes(availabilityStatus as HospitalAvailabilityStatus)) {
    throw new HttpError(400, "Invalid availabilityStatus");
  }
  return availabilityStatus as HospitalAvailabilityStatus;
};

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

export const getHospitals = async (filters: HospitalFilters): Promise<HospitalListResponse> => {
  const { page, limit, skip } = parsePagination({
    page: filters.page,
    limit: filters.limit,
  });
  const sort = parseSort({
    sortBy: filters.sortBy,
    order: filters.order,
    allowedSorts: {
      name: "name",
      city: "city",
      state: "state",
      averageRating: "averageRating",
      ambulanceCount: "ambulanceCount",
      createdAt: "createdAt",
    },
    defaultSort: { createdAt: -1 },
  });

  const query: FilterQuery<IHospital> = {};

  if (filters.search?.trim()) {
    const searchRegex = new RegExp(filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      { name: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
      { address: { $regex: searchRegex } },
    ];
  }

  attachRegexFilter(query, "city", filters.city);
  attachRegexFilter(query, "state", filters.state);

  if (filters.availabilityStatus) {
    query.availabilityStatus = validateAvailabilityStatus(filters.availabilityStatus);
  }

  const specialties = parseCsvParam(filters.specialties);
  if (specialties.length) {
    query.specialties = { $in: specialties };
  }

  const facilities = parseCsvParam(filters.facilities);
  if (facilities.length) {
    query.facilities = { $in: facilities };
  }

  const [hospitals, total] = await Promise.all([
    Hospital.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Hospital.countDocuments(query),
  ]);

  return {
    data: hospitals,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getHospitalById = async (id: string): Promise<Record<string, unknown>> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid hospital id");
  }

  const hospitalId = new Types.ObjectId(id);
  const hospital = await Hospital.findById(hospitalId).lean();

  if (!hospital) {
    throw new HttpError(404, "Hospital not found");
  }

  const [doctorCount, equipmentCount, ambulanceCount, appointmentCount, issueCount, reviewCount] =
    await Promise.all([
      Doctor.countDocuments({ hospitalId }),
      Equipment.countDocuments({ hospitalId }),
      Ambulance.countDocuments({ hospitalId }),
      Appointment.countDocuments({ hospitalId }),
      Issue.countDocuments({ hospitalId }),
      Review.countDocuments({ targetType: "hospital", targetId: hospitalId }),
    ]);

  return {
    ...hospital,
    stats: {
      doctorCount,
      equipmentCount,
      ambulanceCount,
      appointmentCount,
      issueCount,
      reviewCount,
    },
  };
};

export const createHospital = async (payload: CreateHospitalPayload): Promise<IHospital> => {
  const requiredFields = [
    "name",
    "description",
    "address",
    "city",
    "state",
    "pincode",
    "contactNumber",
    "emergencyContact",
  ] as const;

  requiredFields.forEach((field) => {
    if (!payload[field]) {
      throw new HttpError(400, `${field} is required`);
    }
  });

  if (payload.ambulanceCount === undefined || payload.ambulanceCount < 0) {
    throw new HttpError(400, "ambulanceCount is required and must be >= 0");
  }

  const location = validateLocation(payload.location);

  const embeddingText =
    payload.embeddingText?.trim() ||
    buildHospitalEmbeddingText({
      name: payload.name as string,
      description: payload.description,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      specialties: payload.specialties,
      facilities: payload.facilities,
      departments: payload.departments,
    });

  const hasExplicitEmbedding = Array.isArray(payload.embedding) && payload.embedding.length > 0;
  let embedding: number[] = hasExplicitEmbedding ? payload.embedding! : [];
  if (!embedding.length && embeddingText) {
    embedding = await embedBestEffort(embeddingText);
  }

  const hospital = await Hospital.create({
    name: payload.name?.trim(),
    description: payload.description?.trim(),
    address: payload.address?.trim(),
    city: payload.city?.trim(),
    state: payload.state?.trim(),
    pincode: payload.pincode?.trim(),
    location,
    specialties: sanitizeArray(payload.specialties),
    facilities: sanitizeArray(payload.facilities),
    departments: sanitizeArray(payload.departments),
    contactNumber: payload.contactNumber?.trim(),
    emergencyContact: payload.emergencyContact?.trim(),
    ambulanceCount: payload.ambulanceCount,
    averageRating: payload.averageRating ?? 0,
    availabilityStatus: payload.availabilityStatus
      ? validateAvailabilityStatus(payload.availabilityStatus)
      : "free",
    embeddingText,
    embedding,
  });

  return hospital.toObject();
};

export const updateHospital = async (id: string, payload: UpdateHospitalPayload): Promise<IHospital> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid hospital id");
  }

  const hospital = await Hospital.findById(id);
  if (!hospital) {
    throw new HttpError(404, "Hospital not found");
  }

  const hasUpdateField = [
    payload.name,
    payload.description,
    payload.address,
    payload.city,
    payload.state,
    payload.pincode,
    payload.location,
    payload.specialties,
    payload.facilities,
    payload.departments,
    payload.contactNumber,
    payload.emergencyContact,
    payload.ambulanceCount,
    payload.averageRating,
    payload.availabilityStatus,
    payload.embeddingText,
    payload.embedding,
  ].some((value) => value !== undefined);

  if (!hasUpdateField) {
    throw new HttpError(400, "No valid update fields provided");
  }

  if (payload.name !== undefined) {
    const value = payload.name.trim();
    if (!value) throw new HttpError(400, "name cannot be empty");
    hospital.name = value;
  }
  if (payload.description !== undefined) {
    const value = payload.description.trim();
    if (!value) throw new HttpError(400, "description cannot be empty");
    hospital.description = value;
  }
  if (payload.address !== undefined) {
    const value = payload.address.trim();
    if (!value) throw new HttpError(400, "address cannot be empty");
    hospital.address = value;
  }
  if (payload.city !== undefined) {
    const value = payload.city.trim();
    if (!value) throw new HttpError(400, "city cannot be empty");
    hospital.city = value;
  }
  if (payload.state !== undefined) {
    const value = payload.state.trim();
    if (!value) throw new HttpError(400, "state cannot be empty");
    hospital.state = value;
  }
  if (payload.pincode !== undefined) {
    const value = payload.pincode.trim();
    if (!value) throw new HttpError(400, "pincode cannot be empty");
    hospital.pincode = value;
  }
  if (payload.location !== undefined) {
    hospital.location = validateLocation(payload.location);
  }
  if (payload.specialties !== undefined) {
    hospital.specialties = sanitizeArray(payload.specialties);
  }
  if (payload.facilities !== undefined) {
    hospital.facilities = sanitizeArray(payload.facilities);
  }
  if (payload.departments !== undefined) {
    hospital.departments = sanitizeArray(payload.departments);
  }
  if (payload.contactNumber !== undefined) {
    const value = payload.contactNumber.trim();
    if (!value) throw new HttpError(400, "contactNumber cannot be empty");
    hospital.contactNumber = value;
  }
  if (payload.emergencyContact !== undefined) {
    const value = payload.emergencyContact.trim();
    if (!value) throw new HttpError(400, "emergencyContact cannot be empty");
    hospital.emergencyContact = value;
  }
  if (payload.ambulanceCount !== undefined) {
    if (payload.ambulanceCount < 0) {
      throw new HttpError(400, "ambulanceCount must be >= 0");
    }
    hospital.ambulanceCount = payload.ambulanceCount;
  }
  if (payload.averageRating !== undefined) {
    if (payload.averageRating < 0 || payload.averageRating > 5) {
      throw new HttpError(400, "averageRating must be between 0 and 5");
    }
    hospital.averageRating = payload.averageRating;
  }
  if (payload.availabilityStatus !== undefined) {
    hospital.availabilityStatus = validateAvailabilityStatus(payload.availabilityStatus);
  }
  if (payload.embeddingText !== undefined) {
    const value = payload.embeddingText.trim();
    if (!value) throw new HttpError(400, "embeddingText cannot be empty");
    hospital.embeddingText = value;
  }
  if (payload.embedding !== undefined) {
    hospital.embedding = payload.embedding;
  }

  const shouldRebuildEmbeddingText =
    payload.embeddingText === undefined &&
    (payload.name !== undefined ||
      payload.description !== undefined ||
      payload.address !== undefined ||
      payload.city !== undefined ||
      payload.state !== undefined ||
      payload.specialties !== undefined ||
      payload.facilities !== undefined ||
      payload.departments !== undefined);

  if (shouldRebuildEmbeddingText) {
    hospital.embeddingText = buildHospitalEmbeddingText({
      name: hospital.name,
      description: hospital.description,
      address: hospital.address,
      city: hospital.city,
      state: hospital.state,
      specialties: hospital.specialties,
      facilities: hospital.facilities,
      departments: hospital.departments,
    });
  }

  const shouldReEmbed =
    payload.embedding === undefined && (payload.embeddingText !== undefined || shouldRebuildEmbeddingText);

  if (shouldReEmbed && hospital.embeddingText) {
    hospital.embedding = await embedBestEffort(hospital.embeddingText);
  }

  await hospital.save();
  return hospital.toObject();
};

export const deleteHospital = async (id: string): Promise<void> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid hospital id");
  }

  const hospital = await Hospital.findById(id);
  if (!hospital) {
    throw new HttpError(404, "Hospital not found");
  }

  await hospital.deleteOne();
};
