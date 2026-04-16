import { Request, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  getAnalyticsOverview,
  getAppointmentAnalytics,
  getEquipmentAnalytics,
  getIssueAnalytics,
} from "../services/analytics.service";
import { jsonSuccess } from "../utils/respond";

const getScopeInput = (req: Request) => {
  const authReq = req as AuthenticatedRequest;

  return {
    userId: authReq.user.userId,
    hospitalId: req.query.hospitalId as string | undefined,
  };
};

export const getOverviewAnalytics = async (req: Request, res: Response): Promise<void> => {
  const analytics = await getAnalyticsOverview(getScopeInput(req));
  jsonSuccess(res, { data: analytics });
};

export const getEquipmentAnalyticsSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const analytics = await getEquipmentAnalytics(getScopeInput(req));
  jsonSuccess(res, { data: analytics });
};

export const getIssueAnalyticsSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const analytics = await getIssueAnalytics(getScopeInput(req));
  jsonSuccess(res, { data: analytics });
};

export const getAppointmentAnalyticsSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const analytics = await getAppointmentAnalytics(getScopeInput(req));
  jsonSuccess(res, { data: analytics });
};
