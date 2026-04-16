import { FilterQuery, Types, isValidObjectId } from "mongoose";

import { Doctor, IDoctor, Hospital } from "../models";
import { HttpError } from "../utils/http-error";

interface DoctorFilters {
  hospitalId?: string;
  specialization?: string;
  department?: string;
  page?: string;
  limit?: string;
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

const toPositiveNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const ensureHospitalExists = async (hospitalId: string): Promise<void> => {
  if (!isValidObjectId(hospitalId)) {
    throw new HttpError(400, "Invalid hospitalId");
  }

  const hospitalExists = await Hospital.exists({ _id: hospitalId });
  if (!hospitalExists) {
    throw new HttpError(404, "Hospital not found for the provided hospitalId");
  }
};

export const getDoctors = async (filters: DoctorFilters): Promise<DoctorListResponse> => {
  const page = toPositiveNumber(filters.page, 1);
  const limit = Math.min(toPositiveNumber(filters.limit, 10), 100);
  const skip = (page - 1) * limit;

  const query: FilterQuery<IDoctor> = {};

  if (filters.hospitalId) {
    if (!isValidObjectId(filters.hospitalId)) {
      throw new HttpError(400, "Invalid hospitalId filter");
    }
    query.hospitalId = filters.hospitalId;
  }

  if (filters.specialization) {
    query.specialization = { $regex: filters.specialization.trim(), $options: "i" };
  }

  if (filters.department) {
    query.department = { $regex: filters.department.trim(), $options: "i" };
  }

  const [doctors, total] = await Promise.all([
    Doctor.find(query)
      .populate("hospitalId", "name city state contactNumber availabilityStatus")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(query),
  ]);

  return {
    data: doctors,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
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
