import { Request, Response } from "express";

import {
  createAmbulance,
  deleteAmbulance,
  getAmbulanceById,
  getAmbulances,
  updateAmbulance,
} from "../services/ambulance.service";
import { jsonSuccess } from "../utils/respond";

export const listAmbulances = async (req: Request, res: Response): Promise<void> => {
  const result = await getAmbulances({
    search: req.query.search as string | undefined,
    hospitalId: req.query.hospitalId as string | undefined,
    status: req.query.status as string | undefined,
    city: req.query.city as string | undefined,
    state: req.query.state as string | undefined,
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
    sortBy: req.query.sortBy as string | undefined,
    order: req.query.order as string | undefined,
  });

  jsonSuccess(res, { data: result.data, pagination: result.pagination });
};

export const getAmbulance = async (req: Request, res: Response): Promise<void> => {
  const ambulance = await getAmbulanceById(req.params.id);

  jsonSuccess(res, { data: ambulance });
};

export const createAmbulanceRecord = async (req: Request, res: Response): Promise<void> => {
  const ambulance = await createAmbulance({
    hospitalId: req.body.hospitalId,
    vehicleNumber: req.body.vehicleNumber,
    driverName: req.body.driverName,
    contactNumber: req.body.contactNumber,
    status: req.body.status,
    currentLocation: req.body.currentLocation,
  });

  jsonSuccess(res, { message: "Ambulance created successfully", data: ambulance }, 201);
};

export const patchAmbulance = async (req: Request, res: Response): Promise<void> => {
  const ambulance = await updateAmbulance(req.params.id, {
    hospitalId: req.body.hospitalId,
    vehicleNumber: req.body.vehicleNumber,
    driverName: req.body.driverName,
    contactNumber: req.body.contactNumber,
    status: req.body.status,
    currentLocation: req.body.currentLocation,
  });

  jsonSuccess(res, { message: "Ambulance updated successfully", data: ambulance });
};

export const removeAmbulance = async (req: Request, res: Response): Promise<void> => {
  await deleteAmbulance(req.params.id);

  jsonSuccess(res, { message: "Ambulance deleted successfully" });
};
