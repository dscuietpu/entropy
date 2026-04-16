import { Request, Response } from "express";

import {
  createMedicalShop,
  deleteMedicalShop,
  getMedicalShopById,
  getMedicalShops,
  updateMedicalShop,
} from "../services/medicalShop.service";
import { jsonSuccess } from "../utils/respond";

export const listMedicalShops = async (req: Request, res: Response): Promise<void> => {
  const result = await getMedicalShops({
    search: req.query.search as string | undefined,
    city: req.query.city as string | undefined,
    state: req.query.state as string | undefined,
    area: req.query.area as string | undefined,
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
    sortBy: req.query.sortBy as string | undefined,
    order: req.query.order as string | undefined,
  });

  jsonSuccess(res, { data: result.data, pagination: result.pagination });
};

export const getMedicalShop = async (req: Request, res: Response): Promise<void> => {
  const shop = await getMedicalShopById(req.params.id);

  jsonSuccess(res, { data: shop });
};

export const createMedicalShopRecord = async (req: Request, res: Response): Promise<void> => {
  const shop = await createMedicalShop({
    name: req.body.name,
    area: req.body.area,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    location: req.body.location,
    contactNumber: req.body.contactNumber,
    availableMedicines: req.body.availableMedicines,
    embeddingText: req.body.embeddingText,
    embedding: req.body.embedding,
  });

  jsonSuccess(res, { message: "Medical shop created successfully", data: shop }, 201);
};

export const patchMedicalShop = async (req: Request, res: Response): Promise<void> => {
  const shop = await updateMedicalShop(req.params.id, {
    name: req.body.name,
    area: req.body.area,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    location: req.body.location,
    contactNumber: req.body.contactNumber,
    availableMedicines: req.body.availableMedicines,
    embeddingText: req.body.embeddingText,
    embedding: req.body.embedding,
  });

  jsonSuccess(res, { message: "Medical shop updated successfully", data: shop });
};

export const removeMedicalShop = async (req: Request, res: Response): Promise<void> => {
  await deleteMedicalShop(req.params.id);

  jsonSuccess(res, { message: "Medical shop deleted successfully" });
};

