import { FilterQuery, SortOrder } from "mongoose";

import { HttpError } from "./http-error";

type SortFieldMap = Record<string, string | Record<string, SortOrder>>;

interface PaginationInput {
  page?: string;
  limit?: string;
  defaultLimit?: number;
  maxLimit?: number;
}

interface SortInput {
  sortBy?: string;
  order?: string;
  allowedSorts: SortFieldMap;
  defaultSort: Record<string, SortOrder>;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
}

export const parsePagination = ({
  page,
  limit,
  defaultLimit = 10,
  maxLimit = 100,
}: PaginationInput): PaginationResult => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  const safePage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const safeLimit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.floor(parsedLimit), maxLimit)
      : defaultLimit;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};

export const parseSort = ({
  sortBy,
  order,
  allowedSorts,
  defaultSort,
}: SortInput): Record<string, SortOrder> => {
  if (!sortBy) {
    return defaultSort;
  }

  const sortConfig = allowedSorts[sortBy];
  if (!sortConfig) {
    throw new HttpError(400, `Invalid sortBy. Allowed values: ${Object.keys(allowedSorts).join(", ")}`);
  }

  if (typeof sortConfig !== "string") {
    return sortConfig;
  }

  const normalizedOrder = order?.toLowerCase();
  const sortOrder: SortOrder = normalizedOrder === "asc" ? 1 : -1;

  return { [sortConfig]: sortOrder };
};

export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const makeContainsRegex = (value?: string): RegExp | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return new RegExp(escapeRegex(trimmed), "i");
};

export const parseCsvParam = (value?: string): string[] =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

export const buildPaginationMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
});

export const attachRegexFilter = <T>(
  query: FilterQuery<T>,
  field: keyof T | string,
  value?: string
): void => {
  const regex = makeContainsRegex(value);
  if (regex) {
    (query as Record<string, unknown>)[field as string] = { $regex: regex };
  }
};
