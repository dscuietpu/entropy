import { Router } from "express";

import {
  createDoctorRecord,
  getDoctor,
  listDoctors,
  patchDoctor,
  removeDoctor,
} from "../controllers/doctor.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const doctorRouter = Router();

doctorRouter.get("/", asyncHandler(listDoctors));
doctorRouter.get("/:id", asyncHandler(getDoctor));

doctorRouter.post(
  "/",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(createDoctorRecord)
);
doctorRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(patchDoctor)
);
doctorRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("hospital_admin"),
  asyncHandler(removeDoctor)
);

export default doctorRouter;
