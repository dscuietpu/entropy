import { FilterQuery, Types, isValidObjectId } from "mongoose";

import { AMBULANCE_STATUSES, Ambulance, AmbulanceStatus, Hospital, IAmbulance } from "../models";
import { HttpError } from "../utils/http-error";

interface AmbulanceFilters {
  hospitalId?: string;
  status?: string;
  page?: string;
  limit?: string;
}

interface CreateAmbulancePayload {
  hospitalId?: string;
  vehicleNumber?: string;
  driverName?: string;
  contactNumber?: string;
  status?: string;
  currentLocation?: string;
}

interface UpdateAmbulancePayload extends CreateAmbulancePayload {}

interface AmbulanceListResponse {
  data: IAmbulance[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const toPositiveNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const validateStatus = (status: string): AmbulanceStatus => {
  if (!AMBULANCE_STATUSES.includes(status as AmbulanceStatus)) {
    throw new HttpError(400, "Invalid ambulance status");
  }
  return status as AmbulanceStatus;
};

const ensureHospitalExists = async (hospitalId: string): Promise<void> => {
  if (!isValidObjectId(hospitalId)) {
    throw new HttpError(400, "Invalid hospitalId");
  }

  const exists = await Hospital.exists({ _id: hospitalId });
  if (!exists) {
    throw new HttpError(404, "Hospital not found for provided hospitalId");
  }
};

export const getAmbulances = async (filters: AmbulanceFilters): Promise<AmbulanceListResponse> => {
  const page = toPositiveNumber(filters.page, 1);
  const limit = Math.min(toPositiveNumber(filters.limit, 10), 100);
  const skip = (page - 1) * limit;

  const query: FilterQuery<IAmbulance> = {};

  if (filters.hospitalId) {
    if (!isValidObjectId(filters.hospitalId)) {
      throw new HttpError(400, "Invalid hospitalId filter");
    }
    query.hospitalId = filters.hospitalId;
  }

  if (filters.status) {
    query.status = validateStatus(filters.status);
  }

  const [ambulances, total] = await Promise.all([
    Ambulance.find(query)
      .populate("hospitalId", "name city state contactNumber availabilityStatus")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Ambulance.countDocuments(query),
  ]);

  return {
    data: ambulances,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getAmbulanceById = async (id: string): Promise<IAmbulance> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid ambulance id");
  }

  const ambulance = await Ambulance.findById(id)
    .populate("hospitalId", "name city state contactNumber availabilityStatus")
    .lean();

  if (!ambulance) {
    throw new HttpError(404, "Ambulance not found");
  }

  return ambulance;
};

export const createAmbulance = async (payload: CreateAmbulancePayload): Promise<IAmbulance> => {
  const requiredFields = ["hospitalId", "vehicleNumber", "driverName", "contactNumber"] as const;
  requiredFields.forEach((field) => {
    if (!payload[field]) {
      throw new HttpError(400, `${field} is required`);
    }
  });

  await ensureHospitalExists(payload.hospitalId as string);

  const vehicleNumber = payload.vehicleNumber?.trim() as string;
  const existingVehicle = await Ambulance.exists({
    hospitalId: payload.hospitalId,
    vehicleNumber,
  });
  if (existingVehicle) {
    throw new HttpError(409, "vehicleNumber already exists in this hospital");
  }

  const ambulance = await Ambulance.create({
    hospitalId: payload.hospitalId,
    vehicleNumber,
    driverName: payload.driverName?.trim(),
    contactNumber: payload.contactNumber?.trim(),
    status: payload.status ? validateStatus(payload.status) : "available",
    currentLocation: payload.currentLocation?.trim(),
  });

  const created = await Ambulance.findById(ambulance._id)
    .populate("hospitalId", "name city state contactNumber availabilityStatus")
    .lean();

  return created as IAmbulance;
};

export const updateAmbulance = async (
  id: string,
  payload: UpdateAmbulancePayload
): Promise<IAmbulance> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid ambulance id");
  }

  const ambulance = await Ambulance.findById(id);
  if (!ambulance) {
    throw new HttpError(404, "Ambulance not found");
  }

  const hasUpdateField = [
    payload.hospitalId,
    payload.vehicleNumber,
    payload.driverName,
    payload.contactNumber,
    payload.status,
    payload.currentLocation,
  ].some((value) => value !== undefined);

  if (!hasUpdateField) {
    throw new HttpError(400, "No valid update fields provided");
  }

  if (payload.hospitalId !== undefined) {
    await ensureHospitalExists(payload.hospitalId);
    ambulance.hospitalId = new Types.ObjectId(payload.hospitalId);
  }

  if (payload.vehicleNumber !== undefined) {
    const value = payload.vehicleNumber.trim();
    if (!value) throw new HttpError(400, "vehicleNumber cannot be empty");
    const existingVehicle = await Ambulance.exists({
      hospitalId: ambulance.hospitalId,
      vehicleNumber: value,
      _id: { $ne: ambulance._id },
    });
    if (existingVehicle) {
      throw new HttpError(409, "vehicleNumber already exists in this hospital");
    }
    ambulance.vehicleNumber = value;
  }

  if (payload.driverName !== undefined) {
    const value = payload.driverName.trim();
    if (!value) throw new HttpError(400, "driverName cannot be empty");
    ambulance.driverName = value;
  }

  if (payload.contactNumber !== undefined) {
    const value = payload.contactNumber.trim();
    if (!value) throw new HttpError(400, "contactNumber cannot be empty");
    ambulance.contactNumber = value;
  }

  if (payload.status !== undefined) {
    ambulance.status = validateStatus(payload.status);
  }

  if (payload.currentLocation !== undefined) {
    const value = payload.currentLocation.trim();
    ambulance.currentLocation = value || undefined;
  }

  await ambulance.save();

  const updated = await Ambulance.findById(ambulance._id)
    .populate("hospitalId", "name city state contactNumber availabilityStatus")
    .lean();

  return updated as IAmbulance;
};

export const deleteAmbulance = async (id: string): Promise<void> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid ambulance id");
  }

  const ambulance = await Ambulance.findById(id);
  if (!ambulance) {
    throw new HttpError(404, "Ambulance not found");
  }

  await ambulance.deleteOne();
};
