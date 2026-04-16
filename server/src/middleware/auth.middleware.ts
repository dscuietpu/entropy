import { NextFunction, Request, Response } from "express";

import { HttpError } from "../utils/http-error";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user: Express.UserInfo;
}

const extractBearerToken = (authorizationHeader?: string): string => {
  if (!authorizationHeader) {
    throw new HttpError(401, "Authorization header is missing");
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Invalid authorization format");
  }

  return token;
};

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    };

    next();
  } catch (_error) {
    next(new HttpError(401, "Unauthorized"));
  }
};
