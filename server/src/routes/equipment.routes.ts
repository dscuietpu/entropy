import { Router } from "express";

import {
  claimEquipmentById,
  createEquipmentRecord,
  getEquipment,
  listEquipment,
  patchEquipment,
  releaseEquipmentById,
  removeEquipment,
} from "../controllers/equipment.controller";
import { semanticEquipmentSearch } from "../controllers/semantic-search.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const equipmentRouter = Router();

equipmentRouter.post("/search/semantic", asyncHandler(semanticEquipmentSearch));

equipmentRouter.get("/", asyncHandler(listEquipment));
equipmentRouter.get("/:id", asyncHandler(getEquipment));

equipmentRouter.post(
  "/",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(createEquipmentRecord)
);
equipmentRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(patchEquipment)
);
equipmentRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(removeEquipment)
);
equipmentRouter.post(
  "/:id/claim",
  authenticate,
  authorizeRoles("hospital_admin", "doctor"),
  asyncHandler(claimEquipmentById)
);
equipmentRouter.post(
  "/:id/release",
  authenticate,
  authorizeRoles("hospital_admin", "doctor"),
  asyncHandler(releaseEquipmentById)
);

export default equipmentRouter;
