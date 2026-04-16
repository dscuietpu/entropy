import { apiClient } from "@/lib/api";
import type { ChatMessage } from "@/types";

export interface ChatMessageListResponse {
  data: ChatMessage[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ChatMessageFilters {
  page?: number;
  limit?: number;
}

export interface SendChatMessagePayload {
  chatRoomId: string;
  message?: string;
  attachments?: File[];
}

const withAuth = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const createQueryString = (filters: ChatMessageFilters) => {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const chatService = {
  listRoomMessages: async (chatRoomId: string, token: string, filters: ChatMessageFilters = {}) => {
    const response = await apiClient.getEnvelope<ChatMessage[]>(
      `/api/chat/rooms/${encodeURIComponent(chatRoomId)}/messages${createQueryString(filters)}`,
      withAuth(token),
    );

    return {
      data: response.data,
      pagination: response.pagination ?? {
        total: response.data.length,
        page: filters.page ?? 1,
        limit: filters.limit ?? response.data.length,
        totalPages: 1,
      },
    } satisfies ChatMessageListResponse;
  },
  sendMessage: async (payload: SendChatMessagePayload, token: string) => {
    const formData = new FormData();
    formData.append("chatRoomId", payload.chatRoomId);

    if (payload.message?.trim()) {
      formData.append("message", payload.message.trim());
    }

    for (const file of payload.attachments ?? []) {
      formData.append("attachments", file);
    }

    return apiClient.postFormData<ChatMessage>("/api/chat/messages", formData, withAuth(token));
  },
};
