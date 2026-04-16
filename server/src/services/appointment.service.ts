import { FilterQuery, Types, isValidObjectId } from "mongoose";

import {
  APPOINTMENT_STATUSES,
  Appointment,
  AppointmentStatus,
  Doctor,
  Hospital,
  IAppointment,
  User,
} from "../models";
import { HttpError } from "../utils/http-error";
import {
  buildPaginationMeta,
  makeContainsRegex,
  parsePagination,
  parseSort,
} from "../utils/query-builder";
import { emitAppointmentUpdated } from "../sockets";

interface AppointmentFilters {
  search?: string;
  patientId?: string;
  hospitalId?: string;
  doctorId?: string;
  status?: string;
  city?: string;
  state?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  order?: string;
}

interface CreateAppointmentPayload {
  patientId?: string;
  hospitalId?: string;
  doctorId?: string;
  caseSummary?: string;
  appointmentDate?: string;
  status?: string;
}

interface UpdateAppointmentPayload extends CreateAppointmentPayload {}

interface AppointmentListResponse {
  data: IAppointment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const validateStatus = (status: string): AppointmentStatus => {
  if (!APPOINTMENT_STATUSES.includes(status as AppointmentStatus)) {
    throw new HttpError(400, "Invalid appointment status");
  }
  return status as AppointmentStatus;
};

const parseAppointmentDate = (value: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "Invalid appointmentDate");
  }
  return parsed;
};

const validateObjectId = (value: string, field: string): string => {
  if (!isValidObjectId(value)) {
    throw new HttpError(400, `Invalid ${field}`);
  }
  return value;
};

const ensureUserExists = async (userId: string): Promise<void> => {
  const exists = await User.exists({ _id: userId });
  if (!exists) {
    throw new HttpError(404, "Patient not found for provided patientId");
  }
};

const ensureHospitalExists = async (hospitalId: string): Promise<void> => {
  const exists = await Hospital.exists({ _id: hospitalId });
  if (!exists) {
    throw new HttpError(404, "Hospital not found for provided hospitalId");
  }
};

const ensureDoctorExists = async (doctorId: string): Promise<void> => {
  const exists = await Doctor.exists({ _id: doctorId });
  if (!exists) {
    throw new HttpError(404, "Doctor not found for provided doctorId");
  }
};

const ensureDoctorBelongsToHospital = async (doctorId: string, hospitalId: string): Promise<void> => {
  const exists = await Doctor.exists({ _id: doctorId, hospitalId });
  if (!exists) {
    throw new HttpError(400, "doctorId does not belong to the provided hospitalId");
  }
};

const APPOINTMENT_POPULATE = [
  { path: "patientId", select: "name email phone role" },
  { path: "hospitalId", select: "name city state contactNumber availabilityStatus" },
  { path: "doctorId", select: "name specialization department availability averageRating" },
];

const resolveHospitalIds = async (filters: Pick<AppointmentFilters, "hospitalId" | "city" | "state">) => {
  if (filters.hospitalId) {
    return [new Types.ObjectId(validateObjectId(filters.hospitalId, "hospitalId filter"))];
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

export const getAppointments = async (filters: AppointmentFilters): Promise<AppointmentListResponse> => {
  const { page, limit, skip } = parsePagination({
    page: filters.page,
    limit: filters.limit,
  });
  const sort = parseSort({
    sortBy: filters.sortBy,
    order: filters.order,
    allowedSorts: {
      appointmentDate: "appointmentDate",
      status: "status",
      createdAt: "createdAt",
    },
    defaultSort: { appointmentDate: -1, createdAt: -1 },
  });

  const query: FilterQuery<IAppointment> = {};
  const hospitalIds = await resolveHospitalIds(filters);

  if (filters.patientId) {
    query.patientId = validateObjectId(filters.patientId, "patientId filter");
  }
  if (hospitalIds) {
    if (!hospitalIds.length) {
      return {
        data: [],
        pagination: buildPaginationMeta(0, page, limit),
      };
    }
    query.hospitalId = { $in: hospitalIds };
  }
  if (filters.doctorId) {
    query.doctorId = validateObjectId(filters.doctorId, "doctorId filter");
  }
  if (filters.status) {
    query.status = validateStatus(filters.status);
  }
  if (filters.search?.trim()) {
    const searchRegex = makeContainsRegex(filters.search) as RegExp;
    query.caseSummary = { $regex: searchRegex };
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .populate(APPOINTMENT_POPULATE)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(query),
  ]);

  return {
    data: appointments,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getAppointmentById = async (id: string): Promise<IAppointment> => {
  validateObjectId(id, "appointment id");

  const appointment = await Appointment.findById(id).populate(APPOINTMENT_POPULATE).lean();
  if (!appointment) {
    throw new HttpError(404, "Appointment not found");
  }

  return appointment;
};

export const createAppointment = async (payload: CreateAppointmentPayload): Promise<IAppointment> => {
  const requiredFields = [
    "patientId",
    "hospitalId",
    "doctorId",
    "caseSummary",
    "appointmentDate",
  ] as const;

  requiredFields.forEach((field) => {
    if (!payload[field]) {
      throw new HttpError(400, `${field} is required`);
    }
  });

  const patientId = validateObjectId(payload.patientId as string, "patientId");
  const hospitalId = validateObjectId(payload.hospitalId as string, "hospitalId");
  const doctorId = validateObjectId(payload.doctorId as string, "doctorId");
  const caseSummary = (payload.caseSummary as string).trim();
  const appointmentDate = parseAppointmentDate(payload.appointmentDate as string);

  if (!caseSummary) {
    throw new HttpError(400, "caseSummary cannot be empty");
  }

  await Promise.all([ensureUserExists(patientId), ensureHospitalExists(hospitalId), ensureDoctorExists(doctorId)]);
  await ensureDoctorBelongsToHospital(doctorId, hospitalId);

  const appointment = await Appointment.create({
    patientId,
    hospitalId,
    doctorId,
    caseSummary,
    appointmentDate,
    status: payload.status ? validateStatus(payload.status) : "pending",
  });

  const created = await Appointment.findById(appointment._id).populate(APPOINTMENT_POPULATE).lean();
  return created as IAppointment;
};

export const updateAppointment = async (
  id: string,
  payload: UpdateAppointmentPayload
): Promise<IAppointment> => {
  validateObjectId(id, "appointment id");

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new HttpError(404, "Appointment not found");
  }

  const hasUpdateField = [
    payload.patientId,
    payload.hospitalId,
    payload.doctorId,
    payload.caseSummary,
    payload.appointmentDate,
    payload.status,
  ].some((value) => value !== undefined);

  if (!hasUpdateField) {
    throw new HttpError(400, "No valid update fields provided");
  }

  if (payload.patientId !== undefined) {
    const patientId = validateObjectId(payload.patientId, "patientId");
    await ensureUserExists(patientId);
    appointment.patientId = new Types.ObjectId(patientId);
  }

  if (payload.hospitalId !== undefined) {
    const hospitalId = validateObjectId(payload.hospitalId, "hospitalId");
    await ensureHospitalExists(hospitalId);
    appointment.hospitalId = new Types.ObjectId(hospitalId);
  }

  if (payload.doctorId !== undefined) {
    const doctorId = validateObjectId(payload.doctorId, "doctorId");
    await ensureDoctorExists(doctorId);
    appointment.doctorId = new Types.ObjectId(doctorId);
  }

  if (payload.caseSummary !== undefined) {
    const caseSummary = payload.caseSummary.trim();
    if (!caseSummary) {
      throw new HttpError(400, "caseSummary cannot be empty");
    }
    appointment.caseSummary = caseSummary;
  }

  if (payload.appointmentDate !== undefined) {
    appointment.appointmentDate = parseAppointmentDate(payload.appointmentDate);
  }

  if (payload.status !== undefined) {
    appointment.status = validateStatus(payload.status);
  }

  await ensureDoctorBelongsToHospital(
    appointment.doctorId.toString(),
    appointment.hospitalId.toString()
  );

  await appointment.save();

  const updated = await Appointment.findById(appointment._id).populate(APPOINTMENT_POPULATE).lean();
  emitAppointmentUpdated(updated);
  return updated as IAppointment;
};

export const deleteAppointment = async (id: string): Promise<void> => {
  validateObjectId(id, "appointment id");

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new HttpError(404, "Appointment not found");
  }

  await appointment.deleteOne();
};
