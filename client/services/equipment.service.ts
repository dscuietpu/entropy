import { apiClient } from "@/lib/api";
import type { Equipment } from "@/types";

export interface EquipmentListFilters {
  hospitalId?: string;
  status?: "available" | "in-use" | "maintenance";
  type?: string;
  hospitalSection?: string;
  page?: number;
  limit?: number;
}

export interface SaveEquipmentPayload {
  hospitalId: string;
  name: string;
  type: string;
  status?: "available" | "in-use" | "maintenance";
  hospitalSection: string;
  assignedTo?: string;
}

export interface ClaimEquipmentPayload {
  doctorId: string;
}

export interface SemanticEquipmentSearchPayload {
  query: string;
  filters?: {
    hospitalId?: string;
    status?: "available" | "in-use" | "maintenance";
    type?: string;
    hospitalSection?: string;
  };
  topK?: number;
  candidateLimit?: number;
}

export interface SemanticEquipmentSearchResult {
  similarity: number;
  equipment: Equipment & {
    hospitalId?:
      | string
      | {
          _id?: string;
          name: string;
          city?: string;
          state?: string;
          contactNumber?: string;
          availabilityStatus?: "free" | "busy";
        };
  };
}

export interface EquipmentListResponse {
  data: Equipment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const createQueryString = (filters: EquipmentListFilters) => {
  const params = new URLSearchParams();

  if (filters.hospitalId) params.set("hospitalId", filters.hospitalId);
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.hospitalSection) params.set("hospitalSection", filters.hospitalSection);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  return query ? `?${query}` : "";
};

const withAuth = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const equipmentService = {
  list: async (filters: EquipmentListFilters = {}) => {
    const response = await apiClient.getEnvelope<Equipment[]>(
      `/api/equipment${createQueryString(filters)}`,
    );

    return {
      data: response.data,
      pagination: response.pagination ?? {
        total: response.data.length,
        page: filters.page ?? 1,
        limit: filters.limit ?? response.data.length,
        totalPages: 1,
      },
    } satisfies EquipmentListResponse;
  },
  create: (payload: SaveEquipmentPayload, token: string) =>
    apiClient.post<Equipment, SaveEquipmentPayload>("/api/equipment", payload, withAuth(token)),
  update: (id: string, payload: Partial<SaveEquipmentPayload>, token: string) =>
    apiClient.patch<Equipment, Partial<SaveEquipmentPayload>>(`/api/equipment/${id}`, payload, withAuth(token)),
  remove: (id: string, token: string) =>
    apiClient.delete<{ message?: string }>(`/api/equipment/${id}`, withAuth(token)),
  claim: (id: string, payload: ClaimEquipmentPayload, token: string) =>
    apiClient.post<Equipment, ClaimEquipmentPayload>(`/api/equipment/${id}/claim`, payload, withAuth(token)),
  release: (id: string, token: string) =>
    apiClient.post<Equipment, undefined>(`/api/equipment/${id}/release`, undefined, withAuth(token)),
  semanticSearch: (payload: SemanticEquipmentSearchPayload) =>
    apiClient.post<SemanticEquipmentSearchResult[], SemanticEquipmentSearchPayload>(
      "/api/equipment/search/semantic",
      payload,
    ),
};
