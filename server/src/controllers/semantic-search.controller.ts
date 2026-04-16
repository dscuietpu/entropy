import { Request, Response } from "express";

import {
  semanticSearchEquipment,
  semanticSearchHospitals,
  semanticSearchMedicalShops,
} from "../services/semantic-search.service";
import { jsonSuccess } from "../utils/respond";

export const semanticHospitalSearch = async (req: Request, res: Response): Promise<void> => {
  const results = await semanticSearchHospitals({
    query: req.body.query,
    filters: req.body.filters,
    topK: req.body.topK,
    candidateLimit: req.body.candidateLimit,
  });

  jsonSuccess(res, { data: results });
};

export const semanticEquipmentSearch = async (req: Request, res: Response): Promise<void> => {
  const results = await semanticSearchEquipment({
    query: req.body.query,
    filters: req.body.filters,
    topK: req.body.topK,
    candidateLimit: req.body.candidateLimit,
  });

  jsonSuccess(res, { data: results });
};

export const semanticMedicalShopSearch = async (req: Request, res: Response): Promise<void> => {
  const results = await semanticSearchMedicalShops({
    query: req.body.query,
    filters: req.body.filters,
    topK: req.body.topK,
    candidateLimit: req.body.candidateLimit,
  });

  jsonSuccess(res, { data: results });
};

