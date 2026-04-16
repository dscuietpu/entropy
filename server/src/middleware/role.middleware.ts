import { NextFunction, Request, Response } from "express";

import { USER_ROLES, UserRole } from "../models";
import { HttpError } from "../utils/http-error";
import { AuthenticatedRequest } from "./auth.middleware";

export const authorizeRoles =
  (...allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!allowedRoles.length) {
      next(new HttpError(500, "No roles configured for authorization"));
      return;
    }

    const hasInvalidRole = allowedRoles.some((role) => !USER_ROLES.includes(role));
    if (hasInvalidRole) {
      next(new HttpError(500, "Invalid role configuration"));
      return;
    }

    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      next(new HttpError(403, "Forbidden"));
      return;
    }

    next();
  };
