import type { Doctor } from "@/types";

interface AppointmentsFiltersProps {
  status: "" | "pending" | "confirmed" | "completed" | "cancelled";
  doctorId: string;
  doctors: Doctor[];
  onStatusChange: (value: "" | "pending" | "confirmed" | "completed" | "cancelled") => void;
  onDoctorChange: (value: string) => void;
}

export function AppointmentsFilters({
  status,
  doctorId,
  doctors,
  onStatusChange,
  onDoctorChange,
}: AppointmentsFiltersProps) {
  return (
    <section className="surface-card rounded-[30px] p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="field-label">Status</span>
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value as AppointmentsFiltersProps["status"])}
            className="field-control"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <label className="block">
          <span className="field-label">Doctor</span>
          <select
            value={doctorId}
            onChange={(event) => onDoctorChange(event.target.value)}
            className="field-control"
          >
            <option value="">All doctors</option>
            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.name} - {doctor.specialization}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
