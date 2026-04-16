import { FilterQuery, Types, isValidObjectId } from "mongoose";

import {
  Doctor,
  EQUIPMENT_STATUSES,
  Equipment,
  EquipmentStatus,
  Hospital,
  IEquipment,
} from "../models";
import { HttpError } from "../utils/http-error";
import { emitEquipmentUpdated } from "../sockets";
import { buildEquipmentEmbeddingText } from "../utils/buildEmbeddingText";
import {
  attachRegexFilter,
  buildPaginationMeta,
  makeContainsRegex,
  parsePagination,
  parseSort,
} from "../utils/query-builder";
import { embedBestEffort } from "./embedding.service";

interface EquipmentFilters {
  search?: string;
  hospitalId?: string;
  status?: string;
  type?: string;
  hospitalSection?: string;
  city?: string;
  state?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  order?: string;
}

interface CreateEquipmentPayload {
  hospitalId?: string;
  name?: string;
  type?: string;
  status?: string;
  hospitalSection?: string;
  assignedTo?: string;
  lastUsedBy?: string;
  embeddingText?: string;
  embedding?: number[];
}

interface UpdateEquipmentPayload extends CreateEquipmentPayload {}

interface ClaimEquipmentPayload {
  doctorId?: string;
}

interface EquipmentListResponse {
  data: IEquipment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const validateEquipmentStatus = (status: string): EquipmentStatus => {
  if (!EQUIPMENT_STATUSES.includes(status as EquipmentStatus)) {
    throw new HttpError(400, "Invalid status");
  }
  return status as EquipmentStatus;
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

const ensureDoctorExists = async (doctorId: string, hospitalId?: string): Promise<void> => {
  if (!isValidObjectId(doctorId)) {
    throw new HttpError(400, "Invalid doctorId");
  }

  const query: { _id: string; hospitalId?: string } = { _id: doctorId };
  if (hospitalId) {
    query.hospitalId = hospitalId;
  }

  const exists = await Doctor.exists(query);
  if (!exists) {
    throw new HttpError(404, "Doctor not found for provided doctorId");
  }
};

const resolveHospitalIds = async (filters: Pick<EquipmentFilters, "hospitalId" | "city" | "state">) => {
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

export const getEquipmentList = async (filters: EquipmentFilters): Promise<EquipmentListResponse> => {
  const { page, limit, skip } = parsePagination({
    page: filters.page,
    limit: filters.limit,
  });
  const sort = parseSort({
    sortBy: filters.sortBy,
    order: filters.order,
    allowedSorts: {
      name: "name",
      type: "type",
      status: "status",
      hospitalSection: "hospitalSection",
      createdAt: "createdAt",
    },
    defaultSort: { createdAt: -1 },
  });

  const query: FilterQuery<IEquipment> = {};
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
    query.status = validateEquipmentStatus(filters.status);
  }

  if (filters.search?.trim()) {
    const searchRegex = makeContainsRegex(filters.search) as RegExp;
    query.$or = [
      { name: { $regex: searchRegex } },
      { type: { $regex: searchRegex } },
      { hospitalSection: { $regex: searchRegex } },
    ];
  }

  attachRegexFilter(query, "type", filters.type);
  attachRegexFilter(query, "hospitalSection", filters.hospitalSection);

  const [equipment, total] = await Promise.all([
    Equipment.find(query)
      .populate("hospitalId", "name city state contactNumber availabilityStatus")
      .populate("assignedTo", "name specialization department availability")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Equipment.countDocuments(query),
  ]);

  return {
    data: equipment,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getEquipmentById = async (id: string): Promise<IEquipment> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid equipment id");
  }

  const equipment = await Equipment.findById(id)
    .populate("hospitalId", "name city state contactNumber availabilityStatus")
    .populate("assignedTo", "name specialization department availability")
    .populate("lastUsedBy", "name specialization department")
    .lean();

  if (!equipment) {
    throw new HttpError(404, "Equipment not found");
  }

  return equipment;
};

export const createEquipment = async (payload: CreateEquipmentPayload): Promise<IEquipment> => {
  const requiredFields = ["hospitalId", "name", "type", "hospitalSection"] as const;

  requiredFields.forEach((field) => {
    if (!payload[field]) {
      throw new HttpError(400, `${field} is required`);
    }
  });

  await ensureHospitalExists(payload.hospitalId as string);

  if (payload.assignedTo) {
    await ensureDoctorExists(payload.assignedTo, payload.hospitalId);
  }

  if (payload.lastUsedBy) {
    await ensureDoctorExists(payload.lastUsedBy, payload.hospitalId);
  }

  const embeddingText =
    payload.embeddingText?.trim() ||
    buildEquipmentEmbeddingText({
      name: payload.name as string,
      type: payload.type,
      hospitalSection: payload.hospitalSection,
    });

  const hasExplicitEmbedding = Array.isArray(payload.embedding) && payload.embedding.length > 0;
  let embedding: number[] = hasExplicitEmbedding ? payload.embedding! : [];
  if (!embedding.length && embeddingText) {
    embedding = await embedBestEffort(embeddingText);
  }

  const equipment = await Equipment.create({
    hospitalId: payload.hospitalId,
    name: payload.name?.trim(),
    type: payload.type?.trim(),
    status: payload.status ? validateEquipmentStatus(payload.status) : "available",
    hospitalSection: payload.hospitalSection?.trim(),
    assignedTo: payload.assignedTo,
    lastUsedBy: payload.lastUsedBy,
    embeddingText,
    embedding,
  });

  const createdEquipment = await Equipment.findById(equipment._id)
    .populate("hospitalId", "name city state contactNumber availabilityStatus")
    .populate("assignedTo", "name specialization department availability")
    .populate("lastUsedBy", "name specialization department")
    .lean();

  return createdEquipment as IEquipment;
};

export const updateEquipment = async (id: string, payload: UpdateEquipmentPayload): Promise<IEquipment> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid equipment id");
  }

  const equipment = await Equipment.findById(id);
  if (!equipment) {
    throw new HttpError(404, "Equipment not found");
  }

  const hasUpdateField = [
    payload.hospitalId,
    payload.name,
    payload.type,
    payload.status,
    payload.hospitalSection,
    payload.assignedTo,
    payload.lastUsedBy,
    payload.embeddingText,
    payload.embedding,
  ].some((value) => value !== undefined);

  if (!hasUpdateField) {
    throw new HttpError(400, "No valid update fields provided");
  }

  if (payload.hospitalId !== undefined) {
    await ensureHospitalExists(payload.hospitalId);
    equipment.hospitalId = new Types.ObjectId(payload.hospitalId);
  }
  if (payload.name !== undefined) {
    const value = payload.name.trim();
    if (!value) throw new HttpError(400, "name cannot be empty");
    equipment.name = value;
  }
  if (payload.type !== undefined) {
    const value = payload.type.trim();
    if (!value) throw new HttpError(400, "type cannot be empty");
    equipment.type = value;
  }
  if (payload.status !== undefined) {
    equipment.status = validateEquipmentStatus(payload.status);
  }
  if (payload.hospitalSection !== undefined) {
    const value = payload.hospitalSection.trim();
    if (!value) throw new HttpError(400, "hospitalSection cannot be empty");
    equipment.hospitalSection = value;
  }
  if (payload.assignedTo !== undefined) {
    await ensureDoctorExists(payload.assignedTo, equipment.hospitalId.toString());
    equipment.assignedTo = new Types.ObjectId(payload.assignedTo);
  }
  if (payload.lastUsedBy !== undefined) {
    await ensureDoctorExists(payload.lastUsedBy, equipment.hospitalId.toString());
    equipment.lastUsedBy = new Types.ObjectId(payload.lastUsedBy);
  }
  if (payload.embeddingText !== undefined) {
    const value = payload.embeddingText.trim();
    if (!value) throw new HttpError(400, "embeddingText cannot be empty");
    equipment.embeddingText = value;
  }
  if (payload.embedding !== undefined) {
    equipment.embedding = payload.embedding;
  }

  const shouldRebuildEmbeddingText =
    payload.embeddingText === undefined &&
    (payload.name !== undefined || payload.type !== undefined || payload.hospitalSection !== undefined);

  if (shouldRebuildEmbeddingText) {
    equipment.embeddingText = buildEquipmentEmbeddingText({
      name: equipment.name,
      type: equipment.type,
      hospitalSection: equipment.hospitalSection,
    });
  }

  const shouldReEmbed =
    payload.embedding === undefined && (payload.embeddingText !== undefined || shouldRebuildEmbeddingText);

  if (shouldReEmbed && equipment.embeddingText) {
    equipment.embedding = await embedBestEffort(equipment.embeddingText);
  }

  await equipment.save();

  const updatedEquipment = await Equipment.findById(equipment._id)
    .populate("hospitalId", "name city state contactNumber availabilityStatus")
    .populate("assignedTo", "name specialization department availability")
    .populate("lastUsedBy", "name specialization department")
    .lean();

  emitEquipmentUpdated(updatedEquipment);
  return updatedEquipment as IEquipment;
};

export const deleteEquipment = async (id: string): Promise<void> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid equipment id");
  }

  const equipment = await Equipment.findById(id);
  if (!equipment) {
    throw new HttpError(404, "Equipment not found");
  }

  await equipment.deleteOne();
};

export const claimEquipment = async (id: string, payload: ClaimEquipmentPayload): Promise<IEquipment> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid equipment id");
  }

  const doctorId = payload.doctorId;
  if (!doctorId) {
    throw new HttpError(400, "doctorId is required");
  }

  if (!isValidObjectId(doctorId)) {
    throw new HttpError(400, "Invalid doctorId");
  }

  const equipmentDoc = await Equipment.findById(id).lean();
  if (!equipmentDoc) {
    throw new HttpError(404, "Equipment not found");
  }

  await ensureDoctorExists(doctorId, equipmentDoc.hospitalId.toString());

  const updated = await Equipment.findOneAndUpdate(
    { _id: id, status: "available" },
    {
      $set: {
        status: "in-use",
        assignedTo: new Types.ObjectId(doctorId),
        lastUsedBy: new Types.ObjectId(doctorId),
      },
    },
    { new: true }
  )
    .populate("hospitalId", "name city state contactNumber availabilityStatus")
    .populate("assignedTo", "name specialization department availability")
    .populate("lastUsedBy", "name specialization department")
    .lean();

  if (!updated) {
    const latest = await Equipment.findById(id).lean();
    if (!latest) {
      throw new HttpError(404, "Equipment not found");
    }
    if (latest.status === "in-use") {
      throw new HttpError(409, "Equipment is already in use");
    }
    if (latest.status === "maintenance") {
      throw new HttpError(409, "Equipment is under maintenance");
    }
    throw new HttpError(409, "Unable to claim equipment");
  }

  emitEquipmentUpdated(updated);
  return updated;
};

export const releaseEquipment = async (id: string): Promise<IEquipment> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid equipment id");
  }

  const equipment = await Equipment.findById(id);
  if (!equipment) {
    throw new HttpError(404, "Equipment not found");
  }

  equipment.status = "available";
  equipment.assignedTo = undefined;

  await equipment.save();

  const updatedEquipment = await Equipment.findById(equipment._id)
    .populate("hospitalId", "name city state contactNumber availabilityStatus")
    .populate("assignedTo", "name specialization department availability")
    .populate("lastUsedBy", "name specialization department")
    .lean();

  emitEquipmentUpdated(updatedEquipment);
  return updatedEquipment as IEquipment;
};
