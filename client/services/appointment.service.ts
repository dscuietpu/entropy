import { apiClient } from "@/lib/api";
import type { Appointment } from "@/types";

export interface CreateAppointmentPayload {
  patientId: string;
  hospitalId: string;
  doctorId: string;
  caseSummary: string;
  appointmentDate: string;
}

export interface UpdateAppointmentPayload {
  patientId?: string;
  hospitalId?: string;
  doctorId?: string;
  caseSummary?: string;
  appointmentDate?: string;
  status?: "pending" | "confirmed" | "completed" | "cancelled";
}

export interface AppointmentListFilters {
  hospitalId?: string;
  doctorId?: string;
  patientId?: string;
  status?: "pending" | "confirmed" | "completed" | "cancelled";
  page?: number;
  limit?: number;
}

export interface AppointmentListResponse {
  data: Appointment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const withAuth = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const createQueryString = (filters: AppointmentListFilters) => {
  const params = new URLSearchParams();

  if (filters.hospitalId) params.set("hospitalId", filters.hospitalId);
  if (filters.doctorId) params.set("doctorId", filters.doctorId);
  if (filters.patientId) params.set("patientId", filters.patientId);
  if (filters.status) params.set("status", filters.status);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const appointmentService = {
  list: async (filters: AppointmentListFilters, token: string) => {
    const response = await apiClient.getEnvelope<Appointment[]>(
      `/api/appointments${createQueryString(filters)}`,
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
    } satisfies AppointmentListResponse;
  },
  create: (payload: CreateAppointmentPayload, token: string) =>
    apiClient.post<Appointment, CreateAppointmentPayload>("/api/appointments", payload, withAuth(token)),
  update: (id: string, payload: UpdateAppointmentPayload, token: string) =>
    apiClient.patch<Appointment, UpdateAppointmentPayload>(`/api/appointments/${id}`, payload, withAuth(token)),
};
