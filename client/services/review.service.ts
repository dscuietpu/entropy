import { apiClient } from "@/lib/api";
import type { Review } from "@/types";

export interface ReviewListResponse {
  data: Review[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateReviewPayload {
  targetType: "hospital" | "doctor";
  targetId: string;
  rating: number;
  comment: string;
}

const withAuth = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const reviewService = {
  listForHospital: async (hospitalId: string, limit = 6) => {
    const response = await apiClient.getEnvelope<Review[]>(
      `/api/reviews?targetType=hospital&targetId=${encodeURIComponent(hospitalId)}&limit=${limit}`,
    );

    return {
      data: response.data,
      pagination: response.pagination ?? {
        total: response.data.length,
        page: 1,
        limit,
        totalPages: 1,
      },
    } satisfies ReviewListResponse;
  },
  create: (payload: CreateReviewPayload, token: string) =>
    apiClient.post<Review, CreateReviewPayload>("/api/reviews", payload, withAuth(token)),
};
