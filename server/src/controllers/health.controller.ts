import { Request, Response } from "express";

import { jsonSuccess } from "../utils/respond";

export const getHealthStatus = (_req: Request, res: Response): void => {
  jsonSuccess(res, {
    message: "Server is running",
    data: { status: "ok" },
  });
};
