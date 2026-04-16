import { UserRole } from "../models";

declare global {
  namespace Express {
    interface UserInfo {
      userId: string;
      role: UserRole;
      email: string;
    }

    interface Request {
      user?: UserInfo;
    }
  }
}

export {};
