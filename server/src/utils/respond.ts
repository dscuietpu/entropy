import { Response } from "express";

/** Shared pagination shape returned by list services. */
export interface PaginationDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type JsonSuccessPayload<T = unknown> = {
  data?: T;
  message?: string;
  pagination?: PaginationDto;
};

/**
 * Standard JSON success envelope: `{ success: true, ... }`.
 * Omit keys you do not need (e.g. delete handlers often only send `message`).
 */
export const jsonSuccess = <T = unknown>(
  res: Response,
  payload: JsonSuccessPayload<T>,
  statusCode = 200
): void => {
  const body: Record<string, unknown> = { success: true };
  if (payload.data !== undefined) {
    body.data = payload.data;
  }
  if (payload.message !== undefined) {
    body.message = payload.message;
  }
  if (payload.pagination !== undefined) {
    body.pagination = payload.pagination;
  }
  res.status(statusCode).json(body);
};
