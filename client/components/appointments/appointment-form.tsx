"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, LoaderCircle } from "lucide-react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { useAsyncTask, useAuth, useToast } from "@/hooks";
import { getErrorMessage } from "@/lib/utils";
import { appointmentService, doctorService, hospitalService } from "@/services";
import type { Appointment, Doctor, Hospital } from "@/types";

interface AppointmentFormProps {
  initialHospitalId?: string;
  initialDoctorId?: string;
}

export function AppointmentForm({ initialHospitalId = "", initialDoctorId = "" }: AppointmentFormProps) {
  const { token, user } = useAuth();
  const toast = useToast();
  const {
    run: runCreateAppointment,
    isLoading: isSubmitting,
    error: submitError,
    data: createdAppointment,
  } = useAsyncTask<Appointment>();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState({
    hospitalId: initialHospitalId,
    doctorId: initialDoctorId,
    caseSummary: "",
    appointmentDate: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadHospitals = async () => {
      setHospitalsLoading(true);
      setLoadError(null);

      try {
        const response = await hospitalService.list({ limit: 100 });
        if (isMounted) {
          setHospitals(response.data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Failed to load hospitals");
          toast.error("Unable to load hospitals", error instanceof Error ? error.message : "Failed to load hospitals");
        }
      } finally {
        if (isMounted) {
          setHospitalsLoading(false);
        }
      }
    };

    void loadHospitals();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!form.hospitalId) {
      setDoctors([]);
      setForm((current) => ({ ...current, doctorId: "" }));
      return;
    }

    let isMounted = true;

    const loadDoctors = async () => {
      setDoctorsLoading(true);
      setLoadError(null);

      try {
        const response = await doctorService.listByHospital(form.hospitalId, 100);
        if (isMounted) {
          setDoctors(response.data);
          setForm((current) => ({
            ...current,
            doctorId:
              current.doctorId && response.data.some((doctor) => doctor._id === current.doctorId)
                ? current.doctorId
                : "",
          }));
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Failed to load doctors");
          setDoctors([]);
          toast.error("Unable to load doctors", error instanceof Error ? error.message : "Failed to load doctors");
        }
      } finally {
        if (isMounted) {
          setDoctorsLoading(false);
        }
      }
    };

    void loadDoctors();

    return () => {
      isMounted = false;
    };
  }, [form.hospitalId]);

  const selectedHospital = useMemo(
    () => hospitals.find((hospital) => hospital._id === form.hospitalId),
    [form.hospitalId, hospitals],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !user) {
      return;
    }

    try {
      const appointment = await runCreateAppointment(() =>
        appointmentService.create(
          {
            patientId: user.id,
            hospitalId: form.hospitalId,
            doctorId: form.doctorId,
            caseSummary: form.caseSummary,
            appointmentDate: form.appointmentDate,
          },
          token,
        ),
      );

      toast.success(
        "Appointment requested",
        `Scheduled for ${new Date(appointment.appointmentDate).toLocaleString()}.`,
      );
    } catch (submitError) {
      toast.error("Appointment booking failed", getErrorMessage(submitError, "Please try again."));
    }
  };

  return (
    <AuthGuard allowedRoles={["patient", "hospital_admin"]}>
      <div className="mx-auto flex w-full max-w-4xl flex-col px-6 pb-20 pt-10 sm:px-8 lg:px-12">
        <div className="space-y-8 py-12">
          <section className="rounded-[34px] border border-[var(--border)] bg-white/92 shadow-[var(--shadow)]">
            <div className="border-b border-[var(--border)] bg-[linear-gradient(140deg,rgba(10,32,28,0.98),rgba(15,118,110,0.94))] px-8 py-10 text-white">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-white/10 p-3 text-teal-200">
                  <CalendarCheck2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-teal-200">
                    Appointment booking
                  </p>
                  <h1 className="mt-2 text-4xl font-semibold tracking-tight">Book a doctor appointment</h1>
                </div>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-white/78">
                Select a hospital, choose an available doctor, and add a short case summary so the care
                team has context before confirming your appointment.
              </p>
            </div>

            <div className="p-8">
              <form className="grid gap-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="hospitalId">
                      Hospital
                    </label>
                    <select
                      id="hospitalId"
                      value={form.hospitalId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          hospitalId: event.target.value,
                          doctorId: "",
                        }))
                      }
                      disabled={hospitalsLoading}
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    >
                      <option value="">{hospitalsLoading ? "Loading hospitals..." : "Select a hospital"}</option>
                      {hospitals.map((hospital) => (
                        <option key={hospital._id} value={hospital._id}>
                          {hospital.name} • {hospital.city}, {hospital.state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="doctorId">
                      Doctor
                    </label>
                    <select
                      id="doctorId"
                      value={form.doctorId}
                      onChange={(event) => setForm((current) => ({ ...current, doctorId: event.target.value }))}
                      disabled={!form.hospitalId || doctorsLoading}
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    >
                      <option value="">
                        {!form.hospitalId
                          ? "Select a hospital first"
                          : doctorsLoading
                            ? "Loading doctors..."
                            : "Select a doctor"}
                      </option>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          {doctor.name} • {doctor.specialization}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedHospital ? (
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 text-sm text-[var(--muted)]">
                    Booking at <span className="font-semibold text-[var(--foreground)]">{selectedHospital.name}</span> in{" "}
                    {selectedHospital.city}, {selectedHospital.state}
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="caseSummary">
                    Case summary
                  </label>
                  <textarea
                    id="caseSummary"
                    value={form.caseSummary}
                    onChange={(event) => setForm((current) => ({ ...current, caseSummary: event.target.value }))}
                    placeholder="Briefly describe symptoms or the reason for the appointment"
                    rows={5}
                    className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-[var(--foreground)]"
                    htmlFor="appointmentDate"
                  >
                    Appointment date
                  </label>
                  <input
                    id="appointmentDate"
                    type="datetime-local"
                    value={form.appointmentDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, appointmentDate: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  />
                </div>

                {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
                {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
                {createdAppointment ? (
                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                    Appointment created successfully for{" "}
                    <span className="font-semibold">{new Date(createdAppointment.appointmentDate).toLocaleString()}</span>.
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    hospitalsLoading ||
                    doctorsLoading ||
                    !form.hospitalId ||
                    !form.doctorId ||
                    !form.caseSummary.trim() ||
                    !form.appointmentDate
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Booking appointment...
                    </>
                  ) : (
                    "Book Appointment"
                  )}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </AuthGuard>
  );
}
