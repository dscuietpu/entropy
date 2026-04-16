import { Router } from "express";

import {
  createAppointmentRecord,
  getAppointment,
  listAppointments,
  patchAppointment,
  removeAppointment,
} from "../controllers/appointment.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const appointmentRouter = Router();

appointmentRouter.get("/", authenticate, asyncHandler(listAppointments));
appointmentRouter.get("/:id", authenticate, asyncHandler(getAppointment));
appointmentRouter.post(
  "/",
  authenticate,
  authorizeRoles("patient", "hospital_admin"),
  asyncHandler(createAppointmentRecord)
);
appointmentRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles("patient", "hospital_admin", "doctor"),
  asyncHandler(patchAppointment)
);
appointmentRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("patient", "hospital_admin"),
  asyncHandler(removeAppointment)
);

export default appointmentRouter;
