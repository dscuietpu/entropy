import { Router } from "express";

import {
  createMedicalShopRecord,
  getMedicalShop,
  listMedicalShops,
  patchMedicalShop,
  removeMedicalShop,
} from "../controllers/medicalShop.controller";
import { semanticMedicalShopSearch } from "../controllers/semantic-search.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const medicalShopRouter = Router();

medicalShopRouter.post("/search/semantic", asyncHandler(semanticMedicalShopSearch));

medicalShopRouter.get("/", asyncHandler(listMedicalShops));
medicalShopRouter.get("/:id", asyncHandler(getMedicalShop));

medicalShopRouter.post(
  "/",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(createMedicalShopRecord)
);
medicalShopRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(patchMedicalShop)
);
medicalShopRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(removeMedicalShop)
);

export default medicalShopRouter;

