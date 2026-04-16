"use client";

import { LoaderCircle, X } from "lucide-react";

import type { Doctor, EquipmentStatus } from "@/types";

interface EquipmentFormValues {
  name: string;
  type: string;
  status: EquipmentStatus;
  hospitalSection: string;
  assignedTo: string;
}

interface EquipmentFormPanelProps {
  mode: "create" | "edit";
  open: boolean;
  doctors: Doctor[];
  values: EquipmentFormValues;
  onChange: (values: EquipmentFormValues) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function EquipmentFormPanel({
  mode,
  open,
  doctors,
  values,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: EquipmentFormPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(16,35,27,0.34)] backdrop-blur-sm">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#f6faf8_100%)] px-6 py-6 shadow-[0_30px_70px_rgba(16,35,27,0.18)] sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              {mode === "create" ? "New equipment" : "Edit equipment"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              {mode === "create" ? "Add equipment to inventory" : "Update equipment details"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[var(--border)] p-2 text-[var(--muted)] transition hover:bg-[rgba(16,35,27,0.04)]"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 grid gap-5">
          <label className="block">
            <span className="field-label">Equipment name</span>
            <input
              value={values.name}
              onChange={(event) => onChange({ ...values, name: event.target.value })}
              placeholder="Portable ventilator"
              className="field-control"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="field-label">Type</span>
              <input
                value={values.type}
                onChange={(event) => onChange({ ...values, type: event.target.value })}
                placeholder="Respiratory support"
                className="field-control"
              />
            </label>

            <label className="block">
              <span className="field-label">Status</span>
              <select
                value={values.status}
                onChange={(event) => onChange({ ...values, status: event.target.value as EquipmentStatus })}
                className="field-control"
              >
                <option value="available">Available</option>
                <option value="in-use">In use</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="field-label">Hospital section</span>
            <input
              value={values.hospitalSection}
              onChange={(event) => onChange({ ...values, hospitalSection: event.target.value })}
              placeholder="ICU"
              className="field-control"
            />
          </label>

          <label className="block">
            <span className="field-label">Assigned doctor</span>
            <select
              value={values.assignedTo}
              onChange={(event) => onChange({ ...values, assignedTo: event.target.value })}
              className="field-control"
            >
              <option value="">No doctor assigned</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !values.name.trim() || !values.type.trim() || !values.hospitalSection.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : mode === "create" ? (
              "Create Equipment"
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
