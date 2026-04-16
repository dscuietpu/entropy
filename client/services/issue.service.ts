import { apiClient } from "@/lib/api";
import type { Issue } from "@/types";

export interface IssueListFilters {
  status?: "open" | "in-progress" | "resolved";
  issueType?: "public-help" | "equipment-shortage" | "ambulance-request" | "general";
  roleType?: "patient" | "hospital";
  hospitalId?: string;
  page?: number;
  limit?: number;
}

export interface IssueListResponse {
  data: Issue[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateIssuePayload {
  title: string;
  description: string;
  issueType: "public-help" | "equipment-shortage" | "ambulance-request" | "general";
  roleType: "patient" | "hospital";
  hospitalId?: string;
  attachments?: File[];
}

export interface UpdateIssuePayload {
  title?: string;
  description?: string;
  status?: "open" | "in-progress" | "resolved";
  resolvedBy?: string;
  resolvedAt?: string;
}

const withAuth = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const createQueryString = (filters: IssueListFilters) => {
  const params = new URLSearchParams();

  if (filters.status) params.set("status", filters.status);
  if (filters.issueType) params.set("issueType", filters.issueType);
  if (filters.roleType) params.set("roleType", filters.roleType);
  if (filters.hospitalId) params.set("hospitalId", filters.hospitalId);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const issueService = {
  list: async (filters: IssueListFilters = {}) => {
    const response = await apiClient.getEnvelope<Issue[]>(`/api/issues${createQueryString(filters)}`);

    return {
      data: response.data,
      pagination: response.pagination ?? {
        total: response.data.length,
        page: filters.page ?? 1,
        limit: filters.limit ?? response.data.length,
        totalPages: 1,
      },
    } satisfies IssueListResponse;
  },
  create: async (payload: CreateIssuePayload, token: string) => {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    formData.append("issueType", payload.issueType);
    formData.append("roleType", payload.roleType);

    if (payload.hospitalId) {
      formData.append("hospitalId", payload.hospitalId);
    }

    for (const file of payload.attachments ?? []) {
      formData.append("attachments", file);
    }

    return apiClient.postFormData<Issue>("/api/issues", formData, withAuth(token));
  },
  update: (id: string, payload: UpdateIssuePayload, token: string) =>
    apiClient.patch<Issue, UpdateIssuePayload>(`/api/issues/${id}`, payload, withAuth(token)),
};
