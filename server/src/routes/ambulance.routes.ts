import { Router } from "express";

import {
  createAmbulanceRecord,
  getAmbulance,
  listAmbulances,
  patchAmbulance,
  removeAmbulance,
} from "../controllers/ambulance.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const ambulanceRouter = Router();

ambulanceRouter.get("/", asyncHandler(listAmbulances));
ambulanceRouter.get("/:id", asyncHandler(getAmbulance));

ambulanceRouter.post(
  "/",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(createAmbulanceRecord)
);
ambulanceRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(patchAmbulance)
);
ambulanceRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(removeAmbulance)
);

export default ambulanceRouter;
