"use client";

import { LoaderCircle, X } from "lucide-react";

import type { AmbulanceStatus } from "@/types";

interface AmbulanceFormValues {
  vehicleNumber: string;
  driverName: string;
  contactNumber: string;
  status: AmbulanceStatus;
  currentLocation: string;
}

interface AmbulanceFormPanelProps {
  mode: "create" | "edit";
  open: boolean;
  values: AmbulanceFormValues;
  onChange: (values: AmbulanceFormValues) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function AmbulanceFormPanel({
  mode,
  open,
  values,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: AmbulanceFormPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(16,35,27,0.34)] backdrop-blur-sm">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#f6faf8_100%)] px-6 py-6 shadow-[0_30px_70px_rgba(16,35,27,0.18)] sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              {mode === "create" ? "New ambulance" : "Edit ambulance"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              {mode === "create" ? "Add ambulance to fleet" : "Update ambulance details"}
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
            <span className="field-label">Vehicle number</span>
            <input
              value={values.vehicleNumber}
              onChange={(event) => onChange({ ...values, vehicleNumber: event.target.value })}
              placeholder="DL-01-AB-1024"
              className="field-control"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="field-label">Driver name</span>
              <input
                value={values.driverName}
                onChange={(event) => onChange({ ...values, driverName: event.target.value })}
                placeholder="Rahul Singh"
                className="field-control"
              />
            </label>

            <label className="block">
              <span className="field-label">Contact number</span>
              <input
                value={values.contactNumber}
                onChange={(event) => onChange({ ...values, contactNumber: event.target.value })}
                placeholder="+91 98XXXXXX12"
                className="field-control"
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="field-label">Status</span>
              <select
                value={values.status}
                onChange={(event) => onChange({ ...values, status: event.target.value as AmbulanceStatus })}
                className="field-control"
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>

            <label className="block">
              <span className="field-label">Current location</span>
              <input
                value={values.currentLocation}
                onChange={(event) => onChange({ ...values, currentLocation: event.target.value })}
                placeholder="ER Gate / Sector 18 / On route"
                className="field-control"
              />
            </label>
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            type="button"
            onClick={onSubmit}
            disabled={
              isSubmitting ||
              !values.vehicleNumber.trim() ||
              !values.driverName.trim() ||
              !values.contactNumber.trim()
            }
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : mode === "create" ? (
              "Create Ambulance"
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
