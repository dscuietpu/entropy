import { FilterQuery, Types, isValidObjectId } from "mongoose";

import { Doctor, IDoctor, Hospital } from "../models";
import { HttpError } from "../utils/http-error";
import {
  attachRegexFilter,
  buildPaginationMeta,
  makeContainsRegex,
  parsePagination,
  parseSort,
} from "../utils/query-builder";

interface DoctorFilters {
  search?: string;
  hospitalId?: string;
  specialization?: string;
  department?: string;
  city?: string;
  state?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  order?: string;
}

interface CreateDoctorPayload {
  hospitalId?: string;
  name?: string;
  specialization?: string;
  department?: string;
  experience?: number;
  availability?: boolean;
  averageRating?: number;
}

interface UpdateDoctorPayload extends CreateDoctorPayload {}

interface DoctorListResponse {
  data: IDoctor[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const ensureHospitalExists = async (hospitalId: string): Promise<void> => {
  if (!isValidObjectId(hospitalId)) {
    throw new HttpError(400, "Invalid hospitalId");
  }

  const hospitalExists = await Hospital.exists({ _id: hospitalId });
  if (!hospitalExists) {
    throw new HttpError(404, "Hospital not found for the provided hospitalId");
  }
};

const resolveHospitalIds = async (filters: Pick<DoctorFilters, "hospitalId" | "city" | "state">) => {
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

export const getDoctors = async (filters: DoctorFilters): Promise<DoctorListResponse> => {
  const { page, limit, skip } = parsePagination({
    page: filters.page,
    limit: filters.limit,
  });
  const sort = parseSort({
    sortBy: filters.sortBy,
    order: filters.order,
    allowedSorts: {
      name: "name",
      specialization: "specialization",
      department: "department",
      experience: "experience",
      averageRating: "averageRating",
      createdAt: "createdAt",
    },
    defaultSort: { createdAt: -1 },
  });

  const query: FilterQuery<IDoctor> = {};
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

  if (filters.search?.trim()) {
    const searchRegex = makeContainsRegex(filters.search) as RegExp;
    query.$or = [
      { name: { $regex: searchRegex } },
      { specialization: { $regex: searchRegex } },
      { department: { $regex: searchRegex } },
    ];
  }

  attachRegexFilter(query, "specialization", filters.specialization);
  attachRegexFilter(query, "department", filters.department);

  const [doctors, total] = await Promise.all([
    Doctor.find(query)
      .populate("hospitalId", "name city state contactNumber availabilityStatus")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(query),
  ]);

  return {
    data: doctors,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getDoctorById = async (id: string): Promise<IDoctor> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid doctor id");
  }

  const doctor = await Doctor.findById(id)
    .populate("hospitalId", "name city state contactNumber availabilityStatus")
    .lean();

  if (!doctor) {
    throw new HttpError(404, "Doctor not found");
  }

  return doctor;
};

export const createDoctor = async (payload: CreateDoctorPayload): Promise<IDoctor> => {
  const requiredFields = ["hospitalId", "name", "specialization", "department"] as const;

  requiredFields.forEach((field) => {
    if (!payload[field]) {
      throw new HttpError(400, `${field} is required`);
    }
  });

  if (payload.experience === undefined || payload.experience < 0) {
    throw new HttpError(400, "experience is required and must be >= 0");
  }

  await ensureHospitalExists(payload.hospitalId as string);

  const doctor = await Doctor.create({
    hospitalId: payload.hospitalId,
    name: payload.name?.trim(),
    specialization: payload.specialization?.trim(),
    department: payload.department?.trim(),
    experience: payload.experience,
    availability: payload.availability ?? true,
    averageRating: payload.averageRating ?? 0,
  });

  const createdDoctor = await Doctor.findById(doctor._id)
    .populate("hospitalId", "name city state contactNumber availabilityStatus")
    .lean();

  return createdDoctor as IDoctor;
};

export const updateDoctor = async (id: string, payload: UpdateDoctorPayload): Promise<IDoctor> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid doctor id");
  }

  const doctor = await Doctor.findById(id);
  if (!doctor) {
    throw new HttpError(404, "Doctor not found");
  }

  const hasUpdateField = [
    payload.hospitalId,
    payload.name,
    payload.specialization,
    payload.department,
    payload.experience,
    payload.availability,
    payload.averageRating,
  ].some((value) => value !== undefined);

  if (!hasUpdateField) {
    throw new HttpError(400, "No valid update fields provided");
  }

  if (payload.hospitalId !== undefined) {
    await ensureHospitalExists(payload.hospitalId);
    doctor.hospitalId = new Types.ObjectId(payload.hospitalId);
  }
  if (payload.name !== undefined) {
    const value = payload.name.trim();
    if (!value) throw new HttpError(400, "name cannot be empty");
    doctor.name = value;
  }
  if (payload.specialization !== undefined) {
    const value = payload.specialization.trim();
    if (!value) throw new HttpError(400, "specialization cannot be empty");
    doctor.specialization = value;
  }
  if (payload.department !== undefined) {
    const value = payload.department.trim();
    if (!value) throw new HttpError(400, "department cannot be empty");
    doctor.department = value;
  }
  if (payload.experience !== undefined) {
    if (payload.experience < 0) throw new HttpError(400, "experience must be >= 0");
    doctor.experience = payload.experience;
  }
  if (payload.availability !== undefined) {
    doctor.availability = payload.availability;
  }
  if (payload.averageRating !== undefined) {
    if (payload.averageRating < 0 || payload.averageRating > 5) {
      throw new HttpError(400, "averageRating must be between 0 and 5");
    }
    doctor.averageRating = payload.averageRating;
  }

  await doctor.save();

  const updatedDoctor = await Doctor.findById(doctor._id)
    .populate("hospitalId", "name city state contactNumber availabilityStatus")
    .lean();

  return updatedDoctor as IDoctor;
};

export const deleteDoctor = async (id: string): Promise<void> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid doctor id");
  }

  const doctor = await Doctor.findById(id);
  if (!doctor) {
    throw new HttpError(404, "Doctor not found");
  }

  await doctor.deleteOne();
};
