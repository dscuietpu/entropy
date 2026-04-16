import { Router } from "express";

import {
  createHospitalRecord,
  getHospital,
  listHospitals,
  patchHospital,
  removeHospital,
} from "../controllers/hospital.controller";
import { semanticHospitalSearch } from "../controllers/semantic-search.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const hospitalRouter = Router();

hospitalRouter.post("/search/semantic", asyncHandler(semanticHospitalSearch));

hospitalRouter.get("/", asyncHandler(listHospitals));
hospitalRouter.get("/:id", asyncHandler(getHospital));

hospitalRouter.post(
  "/",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(createHospitalRecord)
);
hospitalRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(patchHospital)
);
hospitalRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(removeHospital)
);

export default hospitalRouter;
