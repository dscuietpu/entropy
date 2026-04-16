import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { UserRole } from "../models";

export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export const generateAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: "7d",
  });

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, env.jwtSecret) as JwtPayload;
