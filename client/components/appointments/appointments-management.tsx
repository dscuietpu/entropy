"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

import { AppointmentsFilters } from "@/components/appointments/appointments-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { cn, getErrorMessage } from "@/lib/utils";
import { useAuth, useSocketEvents, useToast } from "@/hooks";
import { appointmentService, doctorService } from "@/services";
import type { Appointment, AppointmentStatus, Doctor } from "@/types";

const statusStyles: Record<AppointmentStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-sky-200 bg-sky-50 text-sky-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

function getName(value: Appointment["patientId"] | Appointment["hospitalId"] | Appointment["doctorId"]) {
  if (!value) return "Unknown";
  if (typeof value === "string") return value;
  return value.name;
}

function getDoctorMeta(value: Appointment["doctorId"]) {
  if (!value || typeof value === "string") return "";
  return [value.specialization, value.department].filter(Boolean).join(" • ");
}

function getHospitalMeta(value: Appointment["hospitalId"]) {
  if (!value || typeof value === "string") return "";
  return [value.city, value.state].filter(Boolean).join(", ");
}

export function AppointmentsManagement() {
  const { token, user } = useAuth();
  const toast = useToast();
  const hospitalId = user?.linkedHospitalId ?? "";

  const [status, setStatus] = useState<"" | AppointmentStatus>("");
  const [doctorId, setDoctorId] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 8, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const loadAppointments = async () => {
    if (!token || !hospitalId) {
      setAppointments([]);
      setLoadError("This account is not linked to a hospital yet.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const [appointmentsResponse, doctorsResponse] = await Promise.all([
        appointmentService.list(
          {
            hospitalId,
            doctorId: doctorId || undefined,
            status: status || undefined,
            page,
            limit: 8,
          },
          token,
        ),
        doctorService.listByHospital(hospitalId, 100),
      ]);

      setAppointments(appointmentsResponse.data);
      setPagination(appointmentsResponse.pagination);
      setDoctors(doctorsResponse.data);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Failed to load appointments"));
      toast.error("Unable to load appointments", getErrorMessage(error, "Failed to load appointments"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAppointments();
  }, [token, hospitalId, doctorId, status, page]);

  useSocketEvents(
    {
      "appointment:updated": (payload) => {
        const updatedAppointment = payload as Appointment;

        const appointmentHospitalId =
          typeof updatedAppointment?.hospitalId === "string"
            ? updatedAppointment.hospitalId
            : updatedAppointment?.hospitalId?._id;
        const appointmentDoctorId =
          typeof updatedAppointment?.doctorId === "string"
            ? updatedAppointment.doctorId
            : updatedAppointment?.doctorId?._id;

        if (
          !updatedAppointment?._id ||
          appointmentHospitalId !== hospitalId ||
          (status && updatedAppointment.status !== status) ||
          (doctorId && appointmentDoctorId !== doctorId)
        ) {
          return;
        }

        setAppointments((current) => {
          const exists = current.some((item) => item._id === updatedAppointment._id);

          if (!exists) {
            return current;
          }

          return current.map((item) => (item._id === updatedAppointment._id ? updatedAppointment : item));
        });
      },
    },
    Boolean(hospitalId),
  );

  const handleStatusUpdate = async (appointmentId: string, nextStatus: AppointmentStatus) => {
    if (!token) {
      setActionError("You must be logged in to update appointments.");
      toast.error("Appointment update failed", "You must be logged in to update appointments.");
      return;
    }

    setActiveActionId(appointmentId);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await appointmentService.update(appointmentId, { status: nextStatus }, token);
      setSuccessMessage("Appointment status updated successfully.");
      toast.success("Appointment updated", `Appointment marked ${nextStatus}.`);
      await loadAppointments();
    } catch (error) {
      setActionError(getErrorMessage(error, "Unable to update appointment status"));
      toast.error("Appointment update failed", getErrorMessage(error, "Unable to update appointment status"));
    } finally {
      setActiveActionId(null);
    }
  };

  const renderStatusBadge = (value: AppointmentStatus) => (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize", statusStyles[value])}>
      {value}
    </span>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-[var(--border)] bg-[linear-gradient(135deg,#0f766e_0%,#134e4a_55%,#10231b_100%)] px-6 py-8 text-white shadow-[0_25px_70px_rgba(15,118,110,0.24)] sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100/90">Appointments management</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Track patient bookings and update care flow</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-teal-50/86">
              Review who booked with which doctor, scan case details quickly, and keep appointment status updated from one hospital workspace.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 text-sm text-white/88 backdrop-blur">
            {pagination.total} appointments in this hospital queue
          </div>
        </div>
      </section>

      <AppointmentsFilters
        status={status}
        doctorId={doctorId}
        doctors={doctors}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onDoctorChange={(value) => {
          setDoctorId(value);
          setPage(1);
        }}
      />

      {successMessage ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}
      {loadError || actionError ? (
        <ErrorState
          title={loadError ? "Unable to load appointments" : "Appointment update failed"}
          description={loadError || actionError || "Something went wrong while managing appointments."}
        />
      ) : null}

      <section className="rounded-[30px] border border-[var(--border)] bg-white/92 shadow-[0_20px_50px_rgba(16,35,27,0.06)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Appointment queue</h2>
            <p className="text-sm text-[var(--muted)]">Appointments are sorted by appointment date for quick scanning.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-8">
            <LoadingState
              title="Loading appointments"
              description="Fetching appointment queue details, patient information, and doctor filters."
            />
          </div>
        ) : appointments.length === 0 ? (
          <div className="px-6 py-8">
            <EmptyState
              title="No appointments found"
              description="Try another doctor or status filter."
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-[var(--border)]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    <th className="px-6 py-4 font-medium">Patient</th>
                    <th className="px-6 py-4 font-medium">Hospital</th>
                    <th className="px-6 py-4 font-medium">Doctor</th>
                    <th className="px-6 py-4 font-medium">Case summary</th>
                    <th className="px-6 py-4 font-medium">Appointment date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {appointments.map((appointment) => (
                    <tr key={appointment._id} className="align-top">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-[var(--foreground)]">{getName(appointment.patientId)}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-[var(--foreground)]">{getName(appointment.hospitalId)}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{getHospitalMeta(appointment.hospitalId)}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-[var(--foreground)]">{getName(appointment.doctorId)}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{getDoctorMeta(appointment.doctorId)}</p>
                      </td>
                      <td className="px-6 py-5 text-sm leading-7 text-[var(--muted)]">{appointment.caseSummary}</td>
                      <td className="px-6 py-5 text-sm text-[var(--muted)]">
                        {new Date(appointment.appointmentDate).toLocaleString()}
                      </td>
                      <td className="px-6 py-5">{renderStatusBadge(appointment.status)}</td>
                      <td className="px-6 py-5">
                        <select
                          value={appointment.status}
                          onChange={(event) =>
                            void handleStatusUpdate(appointment._id, event.target.value as AppointmentStatus)
                          }
                          disabled={activeActionId === appointment._id}
                          className="min-w-[160px] rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm outline-none transition focus:border-[var(--primary)] disabled:opacity-60"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {appointments.map((appointment) => (
                <article key={appointment._id} className="rounded-[24px] border border-[var(--border)] bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">{getName(appointment.patientId)}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{getName(appointment.doctorId)}</p>
                    </div>
                    {renderStatusBadge(appointment.status)}
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                    <p><span className="font-medium text-[var(--foreground)]">Hospital:</span> {getName(appointment.hospitalId)}</p>
                    <p><span className="font-medium text-[var(--foreground)]">Case:</span> {appointment.caseSummary}</p>
                    <p><span className="font-medium text-[var(--foreground)]">Date:</span> {new Date(appointment.appointmentDate).toLocaleString()}</p>
                  </div>

                  <select
                    value={appointment.status}
                    onChange={(event) =>
                      void handleStatusUpdate(appointment._id, event.target.value as AppointmentStatus)
                    }
                    disabled={activeActionId === appointment._id}
                    className="mt-4 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)] disabled:opacity-60"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </article>
              ))}
            </div>
          </>
        )}

        {pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4 text-sm text-[var(--muted)]">
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={pagination.page <= 1}
                className="rounded-full border border-[var(--border)] px-4 py-2 transition hover:bg-[rgba(16,35,27,0.04)] disabled:opacity-60"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-full border border-[var(--border)] px-4 py-2 transition hover:bg-[rgba(16,35,27,0.04)] disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
