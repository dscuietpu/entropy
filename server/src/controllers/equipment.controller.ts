import { Request, Response } from "express";

import {
  claimEquipment,
  createEquipment,
  deleteEquipment,
  getEquipmentById,
  getEquipmentList,
  releaseEquipment,
  updateEquipment,
} from "../services/equipment.service";
import { jsonSuccess } from "../utils/respond";

export const listEquipment = async (req: Request, res: Response): Promise<void> => {
  const result = await getEquipmentList({
    search: req.query.search as string | undefined,
    hospitalId: req.query.hospitalId as string | undefined,
    status: req.query.status as string | undefined,
    type: req.query.type as string | undefined,
    hospitalSection: req.query.hospitalSection as string | undefined,
    city: req.query.city as string | undefined,
    state: req.query.state as string | undefined,
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
    sortBy: req.query.sortBy as string | undefined,
    order: req.query.order as string | undefined,
  });

  jsonSuccess(res, { data: result.data, pagination: result.pagination });
};

export const getEquipment = async (req: Request, res: Response): Promise<void> => {
  const equipment = await getEquipmentById(req.params.id);

  jsonSuccess(res, { data: equipment });
};

export const createEquipmentRecord = async (req: Request, res: Response): Promise<void> => {
  const equipment = await createEquipment({
    hospitalId: req.body.hospitalId,
    name: req.body.name,
    type: req.body.type,
    status: req.body.status,
    hospitalSection: req.body.hospitalSection,
    assignedTo: req.body.assignedTo,
    lastUsedBy: req.body.lastUsedBy,
    embeddingText: req.body.embeddingText,
    embedding: req.body.embedding,
  });

  jsonSuccess(res, { message: "Equipment created successfully", data: equipment }, 201);
};

export const patchEquipment = async (req: Request, res: Response): Promise<void> => {
  const equipment = await updateEquipment(req.params.id, {
    hospitalId: req.body.hospitalId,
    name: req.body.name,
    type: req.body.type,
    status: req.body.status,
    hospitalSection: req.body.hospitalSection,
    assignedTo: req.body.assignedTo,
    lastUsedBy: req.body.lastUsedBy,
    embeddingText: req.body.embeddingText,
    embedding: req.body.embedding,
  });

  jsonSuccess(res, { message: "Equipment updated successfully", data: equipment });
};

export const removeEquipment = async (req: Request, res: Response): Promise<void> => {
  await deleteEquipment(req.params.id);

  jsonSuccess(res, { message: "Equipment deleted successfully" });
};

export const claimEquipmentById = async (req: Request, res: Response): Promise<void> => {
  const equipment = await claimEquipment(req.params.id, {
    doctorId: req.body.doctorId,
  });

  jsonSuccess(res, { message: "Equipment claimed successfully", data: equipment });
};

export const releaseEquipmentById = async (req: Request, res: Response): Promise<void> => {
  const equipment = await releaseEquipment(req.params.id);

  jsonSuccess(res, { message: "Equipment released successfully", data: equipment });
};
