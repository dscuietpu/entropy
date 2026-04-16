import { apiClient } from "@/lib/api";
import type { Hospital } from "@/types";

export interface HospitalListFilters {
  city?: string;
  state?: string;
  availabilityStatus?: "free" | "busy";
  specialties?: string;
  page?: number;
  limit?: number;
}

export interface HospitalListResponse {
  data: Hospital[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SemanticHospitalSearchPayload {
  query: string;
  filters?: {
    city?: string;
    state?: string;
    availabilityStatus?: "free" | "busy";
  };
  topK?: number;
  candidateLimit?: number;
}

export interface SemanticHospitalSearchResult {
  similarity: number;
  hospital: Hospital;
}

const createQueryString = (filters: HospitalListFilters) => {
  const params = new URLSearchParams();

  if (filters.city) params.set("city", filters.city);
  if (filters.state) params.set("state", filters.state);
  if (filters.availabilityStatus) params.set("availabilityStatus", filters.availabilityStatus);
  if (filters.specialties) params.set("specialties", filters.specialties);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const hospitalService = {
  list: async (filters: HospitalListFilters = {}) => {
    const response = await apiClient.getEnvelope<Hospital[]>(
      `/api/hospitals${createQueryString(filters)}`,
    );

    return {
      data: response.data,
      pagination: response.pagination ?? {
        total: response.data.length,
        page: filters.page ?? 1,
        limit: filters.limit ?? response.data.length,
        totalPages: 1,
      },
    } satisfies HospitalListResponse;
  },
  getById: (id: string) => apiClient.get<Hospital>(`/api/hospitals/${id}`),
  semanticSearch: (payload: SemanticHospitalSearchPayload) =>
    apiClient.post<SemanticHospitalSearchResult[], SemanticHospitalSearchPayload>(
      "/api/hospitals/search/semantic",
      payload,
    ),
};
