import { apiClient } from "@/lib/api";

interface SummarizeReviewsPayload {
  reviewTexts: string[];
}

interface SummarizeReviewsResponse {
  summary: string;
}

interface ChatPayload {
  message: string;
  context?: string;
}

interface ChatResponse {
  response: string;
}

export const aiService = {
  summarizeReviews: (reviewTexts: string[]) =>
    apiClient.post<SummarizeReviewsResponse, SummarizeReviewsPayload>("/api/ai/summarize-reviews", {
      reviewTexts,
    }),
  chat: (payload: ChatPayload) => apiClient.post<ChatResponse, ChatPayload>("/api/ai/chat", payload),
};
