import { FilterQuery, Types, isValidObjectId } from "mongoose";

import { AMBULANCE_STATUSES, Ambulance, AmbulanceStatus, Hospital, IAmbulance } from "../models";
import { HttpError } from "../utils/http-error";
import {
  buildPaginationMeta,
  makeContainsRegex,
  parsePagination,
  parseSort,
} from "../utils/query-builder";

interface AmbulanceFilters {
  search?: string;
  hospitalId?: string;
  status?: string;
  city?: string;
  state?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  order?: string;
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

const resolveHospitalIds = async (filters: Pick<AmbulanceFilters, "hospitalId" | "city" | "state">) => {
  if (filters.hospitalId) {
    if (!isValidObjectId(filters.hospitalId)) {
      throw new HttpError(400, "Invalid hospitalId filter");
    }

    return [new Types.ObjectId(filters.hospitalId)];
  }

  if (!filters.city && !filters.state) {
    return undefined;
  }

  const hospitalQuery: FilterQuery<{ city: string; state: string }> = {};
  const cityRegex = makeContainsRegex(filters.city);
  const stateRegex = makeContainsRegex(filters.state);

  if (cityRegex) {
    hospitalQuery.city = { $regex: cityRegex };
  }
  if (stateRegex) {
    hospitalQuery.state = { $regex: stateRegex };
  }

  const hospitals = await Hospital.find(hospitalQuery).select("_id").lean();
  return hospitals.map((hospital) => hospital._id as Types.ObjectId);
};

export const getAmbulances = async (filters: AmbulanceFilters): Promise<AmbulanceListResponse> => {
  const { page, limit, skip } = parsePagination({
    page: filters.page,
    limit: filters.limit,
  });
  const sort = parseSort({
    sortBy: filters.sortBy,
    order: filters.order,
    allowedSorts: {
      vehicleNumber: "vehicleNumber",
      driverName: "driverName",
      status: "status",
      createdAt: "createdAt",
    },
    defaultSort: { createdAt: -1 },
  });

  const query: FilterQuery<IAmbulance> = {};
  const hospitalIds = await resolveHospitalIds(filters);

  if (hospitalIds) {
    if (!hospitalIds.length) {
      return {
        data: [],
        pagination: buildPaginationMeta(0, page, limit),
      };
    }
    query.hospitalId = { $in: hospitalIds };
  }

  if (filters.status) {
    query.status = validateStatus(filters.status);
  }

  if (filters.search?.trim()) {
    const searchRegex = makeContainsRegex(filters.search) as RegExp;
    query.$or = [
      { vehicleNumber: { $regex: searchRegex } },
      { driverName: { $regex: searchRegex } },
      { currentLocation: { $regex: searchRegex } },
    ];
  }

  const [ambulances, total] = await Promise.all([
    Ambulance.find(query)
      .populate("hospitalId", "name city state contactNumber availabilityStatus")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Ambulance.countDocuments(query),
  ]);

  return {
    data: ambulances,
    pagination: buildPaginationMeta(total, page, limit),
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
