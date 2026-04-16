"use client";

import { useEffect, useState } from "react";
import { Ambulance, PencilLine, Plus, Trash2 } from "lucide-react";

import { AmbulanceFilters } from "@/components/ambulances/ambulance-filters";
import { AmbulanceFormPanel } from "@/components/ambulances/ambulance-form-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { cn, getErrorMessage } from "@/lib/utils";
import { useAuth, useToast } from "@/hooks";
import { ambulanceService } from "@/services";
import type { Ambulance as AmbulanceEntity, AmbulanceStatus } from "@/types";

type AmbulanceFormState = {
  vehicleNumber: string;
  driverName: string;
  contactNumber: string;
  status: AmbulanceStatus;
  currentLocation: string;
};

const initialForm: AmbulanceFormState = {
  vehicleNumber: "",
  driverName: "",
  contactNumber: "",
  status: "available",
  currentLocation: "",
};

const statusStyles: Record<AmbulanceStatus, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  busy: "border-amber-200 bg-amber-50 text-amber-700",
  maintenance: "border-rose-200 bg-rose-50 text-rose-700",
};

export function AmbulanceManagement() {
  const { token, user } = useAuth();
  const toast = useToast();
  const hospitalId = user?.linkedHospitalId ?? "";

  const [statusFilter, setStatusFilter] = useState<"" | AmbulanceStatus>("");
  const [ambulances, setAmbulances] = useState<AmbulanceEntity[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 8, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingAmbulanceId, setEditingAmbulanceId] = useState<string | null>(null);
  const [form, setForm] = useState<AmbulanceFormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAmbulances = async () => {
    if (!hospitalId) {
      setAmbulances([]);
      setLoadError("This account is not linked to a hospital yet.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await ambulanceService.list({
        hospitalId,
        status: statusFilter || undefined,
        page,
        limit: 8,
      });

      setAmbulances(response.data);
      setPagination(response.pagination);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Failed to load ambulances"));
      toast.error("Unable to load ambulances", getErrorMessage(error, "Failed to load ambulances"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAmbulances();
  }, [hospitalId, page, statusFilter]);

  const openCreatePanel = () => {
    setFormMode("create");
    setEditingAmbulanceId(null);
    setForm(initialForm);
    setActionError(null);
    setPanelOpen(true);
  };

  const openEditPanel = (item: AmbulanceEntity) => {
    setFormMode("edit");
    setEditingAmbulanceId(item._id);
    setForm({
      vehicleNumber: item.vehicleNumber,
      driverName: item.driverName,
      contactNumber: item.contactNumber,
      status: item.status,
      currentLocation: item.currentLocation ?? "",
    });
    setActionError(null);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingAmbulanceId(null);
    setForm(initialForm);
    setActionError(null);
  };

  const handleSave = async () => {
    if (!token || !hospitalId) {
      setActionError("You must be logged in as a hospital admin to manage ambulances.");
      toast.error("Ambulance action failed", "You must be logged in as a hospital admin to manage ambulances.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);

    const payload = {
      hospitalId,
      vehicleNumber: form.vehicleNumber.trim(),
      driverName: form.driverName.trim(),
      contactNumber: form.contactNumber.trim(),
      status: form.status,
      currentLocation: form.currentLocation.trim() || undefined,
    };

    try {
      if (formMode === "create") {
        await ambulanceService.create(payload, token);
        setSuccessMessage("Ambulance created successfully.");
        toast.success("Ambulance created", "The fleet record was added successfully.");
      } else if (editingAmbulanceId) {
        await ambulanceService.update(editingAmbulanceId, payload, token);
        setSuccessMessage("Ambulance updated successfully.");
        toast.success("Ambulance updated", "The fleet record was updated successfully.");
      }

      closePanel();
      await loadAmbulances();
    } catch (error) {
      setActionError(getErrorMessage(error, "Unable to save ambulance"));
      toast.error("Ambulance action failed", getErrorMessage(error, "Unable to save ambulance"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) {
      setActionError("You must be logged in to delete an ambulance.");
      toast.error("Delete failed", "You must be logged in to delete an ambulance.");
      return;
    }

    if (!window.confirm("Delete this ambulance record?")) return;

    setActiveActionId(id);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await ambulanceService.remove(id, token);
      setSuccessMessage("Ambulance deleted successfully.");
      toast.success("Ambulance deleted", "The fleet record was removed.");
      await loadAmbulances();
    } catch (error) {
      setActionError(getErrorMessage(error, "Unable to delete ambulance"));
      toast.error("Delete failed", getErrorMessage(error, "Unable to delete ambulance"));
    } finally {
      setActiveActionId(null);
    }
  };

  const renderStatusBadge = (status: AmbulanceStatus) => (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize", statusStyles[status])}>
      {status}
    </span>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-[var(--border)] bg-[linear-gradient(135deg,#0f766e_0%,#134e4a_55%,#10231b_100%)] px-6 py-8 text-white shadow-[0_25px_70px_rgba(15,118,110,0.24)] sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100/90">Ambulance management</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Manage your hospital response fleet</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-teal-50/86">
              Keep ambulance availability, driver contact details, and live location references easy to update during patient support and emergency coordination.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreatePanel}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-teal-50"
          >
            <Plus className="h-4 w-4" />
            Add ambulance
          </button>
        </div>
      </section>

      <AmbulanceFilters
        value={{ status: statusFilter }}
        onChange={(next) => {
          setStatusFilter(next.status);
          setPage(1);
        }}
      />

      {successMessage ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">{successMessage}</div>
      ) : null}
      {loadError || actionError ? (
        <ErrorState
          title={loadError ? "Unable to load ambulances" : "Ambulance action failed"}
          description={loadError || actionError || "Something went wrong while managing ambulances."}
        />
      ) : null}

      <section className="rounded-[30px] border border-[var(--border)] bg-white/92 shadow-[0_20px_50px_rgba(16,35,27,0.06)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Ambulance fleet</h2>
            <p className="text-sm text-[var(--muted)]">{pagination.total} total fleet records for this hospital.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-8">
            <LoadingState
              title="Loading ambulance fleet"
              description="Fetching vehicle, driver, and availability data for this hospital fleet."
            />
          </div>
        ) : ambulances.length === 0 ? (
          <div className="px-6 py-8">
            <EmptyState
              title="No ambulances found"
              description="Add the first ambulance or change the current status filter."
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-[var(--border)]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    <th className="px-6 py-4 font-medium">Vehicle number</th>
                    <th className="px-6 py-4 font-medium">Driver</th>
                    <th className="px-6 py-4 font-medium">Contact</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Current location</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {ambulances.map((item) => (
                    <tr key={item._id}>
                      <td className="px-6 py-5 font-semibold text-[var(--foreground)]">{item.vehicleNumber}</td>
                      <td className="px-6 py-5 text-sm text-[var(--muted)]">{item.driverName}</td>
                      <td className="px-6 py-5 text-sm text-[var(--muted)]">{item.contactNumber}</td>
                      <td className="px-6 py-5">{renderStatusBadge(item.status)}</td>
                      <td className="px-6 py-5 text-sm text-[var(--muted)]">{item.currentLocation || "Not set"}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEditPanel(item)}
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[rgba(16,35,27,0.04)]"
                          >
                            <PencilLine className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(item._id)}
                            disabled={activeActionId === item._id}
                            className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {ambulances.map((item) => (
                <article key={item._id} className="rounded-[24px] border border-[var(--border)] bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">{item.vehicleNumber}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{item.driverName}</p>
                    </div>
                    {renderStatusBadge(item.status)}
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                    <p><span className="font-medium text-[var(--foreground)]">Contact:</span> {item.contactNumber}</p>
                    <p><span className="font-medium text-[var(--foreground)]">Current location:</span> {item.currentLocation || "Not set"}</p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditPanel(item)}
                      className="flex-1 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[rgba(16,35,27,0.04)]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item._id)}
                      disabled={activeActionId === item._id}
                      className="flex-1 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
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

      <AmbulanceFormPanel
        mode={formMode}
        open={panelOpen}
        values={form}
        onChange={setForm}
        onClose={closePanel}
        onSubmit={() => void handleSave()}
        isSubmitting={isSubmitting}
        error={actionError}
      />
    </div>
  );
}
