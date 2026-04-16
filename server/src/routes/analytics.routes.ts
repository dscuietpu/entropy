import { Router } from "express";

import {
  getAppointmentAnalyticsSummary,
  getEquipmentAnalyticsSummary,
  getIssueAnalyticsSummary,
  getOverviewAnalytics,
} from "../controllers/analytics.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const analyticsRouter = Router();

analyticsRouter.use(authenticate, authorizeRoles("hospital_admin", "doctor"));

analyticsRouter.get("/overview", asyncHandler(getOverviewAnalytics));
analyticsRouter.get("/equipment", asyncHandler(getEquipmentAnalyticsSummary));
analyticsRouter.get("/issues", asyncHandler(getIssueAnalyticsSummary));
analyticsRouter.get("/appointments", asyncHandler(getAppointmentAnalyticsSummary));

export default analyticsRouter;
