import { Request, Response } from "express";

import {
  createHospital,
  deleteHospital,
  getHospitalById,
  getHospitals,
  updateHospital,
} from "../services/hospital.service";
import { jsonSuccess } from "../utils/respond";

export const listHospitals = async (req: Request, res: Response): Promise<void> => {
  const result = await getHospitals({
    search: req.query.search as string | undefined,
    city: req.query.city as string | undefined,
    state: req.query.state as string | undefined,
    availabilityStatus: req.query.availabilityStatus as string | undefined,
    specialties: req.query.specialties as string | undefined,
    facilities: req.query.facilities as string | undefined,
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
    sortBy: req.query.sortBy as string | undefined,
    order: req.query.order as string | undefined,
  });

  jsonSuccess(res, { data: result.data, pagination: result.pagination });
};

export const getHospital = async (req: Request, res: Response): Promise<void> => {
  const hospital = await getHospitalById(req.params.id);

  jsonSuccess(res, { data: hospital });
};

export const createHospitalRecord = async (req: Request, res: Response): Promise<void> => {
  const hospital = await createHospital({
    name: req.body.name,
    description: req.body.description,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    location: req.body.location,
    specialties: req.body.specialties,
    facilities: req.body.facilities,
    departments: req.body.departments,
    contactNumber: req.body.contactNumber,
    emergencyContact: req.body.emergencyContact,
    ambulanceCount: req.body.ambulanceCount,
    averageRating: req.body.averageRating,
    availabilityStatus: req.body.availabilityStatus,
    embeddingText: req.body.embeddingText,
    embedding: req.body.embedding,
  });

  jsonSuccess(res, { message: "Hospital created successfully", data: hospital }, 201);
};

export const patchHospital = async (req: Request, res: Response): Promise<void> => {
  const hospital = await updateHospital(req.params.id, {
    name: req.body.name,
    description: req.body.description,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    location: req.body.location,
    specialties: req.body.specialties,
    facilities: req.body.facilities,
    departments: req.body.departments,
    contactNumber: req.body.contactNumber,
    emergencyContact: req.body.emergencyContact,
    ambulanceCount: req.body.ambulanceCount,
    averageRating: req.body.averageRating,
    availabilityStatus: req.body.availabilityStatus,
    embeddingText: req.body.embeddingText,
    embedding: req.body.embedding,
  });

  jsonSuccess(res, { message: "Hospital updated successfully", data: hospital });
};

export const removeHospital = async (req: Request, res: Response): Promise<void> => {
  await deleteHospital(req.params.id);

  jsonSuccess(res, { message: "Hospital deleted successfully" });
};
