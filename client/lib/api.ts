import { getErrorMessage } from "@/lib/utils";
import type { ApiErrorPayload, ApiRequestOptions, ApiSuccessResponse } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim();

export function getApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }

  return API_BASE_URL;
}

export function getApiOrigin() {
  return new URL(getApiBaseUrl()).origin;
}

export function buildUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  return new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

function isErrorPayload(payload: unknown): payload is ApiErrorPayload {
  return typeof payload === "object" && payload !== null && "message" in payload;
}

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function apiRequestEnvelope<TResponse, TBody = unknown>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<ApiSuccessResponse<TResponse>> {
  const { body, headers, ...requestInit } = options;

  const response = await fetch(buildUrl(path), {
    ...requestInit,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseResponse<ApiSuccessResponse<TResponse> | ApiErrorPayload>(response);

  if (!response.ok) {
    const message = isErrorPayload(payload) ? payload.message : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, isErrorPayload(payload) ? payload : undefined);
  }

  if (typeof payload === "object" && payload && "data" in payload) {
    return payload;
  }

  return {
    data: payload as TResponse,
  };
}

export async function apiRequestFormData<TResponse>(
  path: string,
  body: FormData,
  options: Omit<ApiRequestOptions<FormData>, "method" | "body" | "headers"> & {
    headers?: Record<string, string>;
    method?: "POST" | "PATCH" | "PUT";
  } = {},
) {
  const { headers, method = "POST", ...requestInit } = options;

  const response = await fetch(buildUrl(path), {
    ...requestInit,
    method,
    headers,
    body,
  });

  const payload = await parseResponse<ApiSuccessResponse<TResponse> | ApiErrorPayload>(response);

  if (!response.ok) {
    const message = isErrorPayload(payload) ? payload.message : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, isErrorPayload(payload) ? payload : undefined);
  }

  if (typeof payload === "object" && payload && "data" in payload) {
    return payload.data;
  }

  return payload as TResponse;
}

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
) {
  const payload = await apiRequestEnvelope<TResponse, TBody>(path, options);
  return payload.data;
}

export const apiClient = {
  get: <TResponse>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<TResponse>(path, { ...options, method: "GET" }),
  getEnvelope: <TResponse>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequestEnvelope<TResponse>(path, { ...options, method: "GET" }),
  post: <TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<ApiRequestOptions<TBody>, "method" | "body">) =>
    apiRequest<TResponse, TBody>(path, { ...options, method: "POST", body }),
  put: <TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<ApiRequestOptions<TBody>, "method" | "body">) =>
    apiRequest<TResponse, TBody>(path, { ...options, method: "PUT", body }),
  patch: <TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<ApiRequestOptions<TBody>, "method" | "body">) =>
    apiRequest<TResponse, TBody>(path, { ...options, method: "PATCH", body }),
  delete: <TResponse>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<TResponse>(path, { ...options, method: "DELETE" }),
  postFormData: <TResponse>(
    path: string,
    body: FormData,
    options?: Omit<ApiRequestOptions<FormData>, "method" | "body" | "headers"> & {
      headers?: Record<string, string>;
    },
  ) => apiRequestFormData<TResponse>(path, body, { ...options, method: "POST" }),
  patchFormData: <TResponse>(
    path: string,
    body: FormData,
    options?: Omit<ApiRequestOptions<FormData>, "method" | "body" | "headers"> & {
      headers?: Record<string, string>;
    },
  ) => apiRequestFormData<TResponse>(path, body, { ...options, method: "PATCH" }),
};

export function toApiError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError(getErrorMessage(error), 500);
}
