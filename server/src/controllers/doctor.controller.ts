import { Request, Response } from "express";

import {
  createDoctor,
  deleteDoctor,
  getDoctorById,
  getDoctors,
  updateDoctor,
} from "../services/doctor.service";
import { jsonSuccess } from "../utils/respond";

export const listDoctors = async (req: Request, res: Response): Promise<void> => {
  const result = await getDoctors({
    search: req.query.search as string | undefined,
    hospitalId: req.query.hospitalId as string | undefined,
    specialization: req.query.specialization as string | undefined,
    department: req.query.department as string | undefined,
    city: req.query.city as string | undefined,
    state: req.query.state as string | undefined,
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
    sortBy: req.query.sortBy as string | undefined,
    order: req.query.order as string | undefined,
  });

  jsonSuccess(res, { data: result.data, pagination: result.pagination });
};

export const getDoctor = async (req: Request, res: Response): Promise<void> => {
  const doctor = await getDoctorById(req.params.id);

  jsonSuccess(res, { data: doctor });
};

export const createDoctorRecord = async (req: Request, res: Response): Promise<void> => {
  const doctor = await createDoctor({
    hospitalId: req.body.hospitalId,
    name: req.body.name,
    specialization: req.body.specialization,
    department: req.body.department,
    experience: req.body.experience,
    availability: req.body.availability,
    averageRating: req.body.averageRating,
  });

  jsonSuccess(res, { message: "Doctor created successfully", data: doctor }, 201);
};

export const patchDoctor = async (req: Request, res: Response): Promise<void> => {
  const doctor = await updateDoctor(req.params.id, {
    hospitalId: req.body.hospitalId,
    name: req.body.name,
    specialization: req.body.specialization,
    department: req.body.department,
    experience: req.body.experience,
    availability: req.body.availability,
    averageRating: req.body.averageRating,
  });

  jsonSuccess(res, { message: "Doctor updated successfully", data: doctor });
};

export const removeDoctor = async (req: Request, res: Response): Promise<void> => {
  await deleteDoctor(req.params.id);

  jsonSuccess(res, { message: "Doctor deleted successfully" });
};
