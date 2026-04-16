"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, PackagePlus, PencilLine, RotateCcw, Trash2 } from "lucide-react";

import { EquipmentFilters } from "@/components/equipment/equipment-filters";
import { EquipmentFormPanel } from "@/components/equipment/equipment-form-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { cn, getErrorMessage } from "@/lib/utils";
import { useAuth, useSocketEvents, useToast } from "@/hooks";
import { doctorService, equipmentService } from "@/services";
import type { Doctor, Equipment, EquipmentStatus } from "@/types";

type PopulatedDoctor = Pick<Doctor, "_id" | "name" | "specialization" | "department">;
type EquipmentRecord = Omit<Equipment, "assignedTo"> & {
  assignedTo?: string | PopulatedDoctor;
};

type FiltersState = {
  status: "" | "available" | "in-use" | "maintenance";
  type: string;
  hospitalSection: string;
};

type FormState = {
  name: string;
  type: string;
  status: EquipmentStatus;
  hospitalSection: string;
  assignedTo: string;
};

const initialFilters: FiltersState = {
  status: "",
  type: "",
  hospitalSection: "",
};

const initialForm: FormState = {
  name: "",
  type: "",
  status: "available",
  hospitalSection: "",
  assignedTo: "",
};

const statusStyles: Record<EquipmentStatus, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "in-use": "border-amber-200 bg-amber-50 text-amber-700",
  maintenance: "border-rose-200 bg-rose-50 text-rose-700",
};

function getAssignedDoctorName(assignedTo?: string | PopulatedDoctor) {
  if (!assignedTo) return "Unassigned";
  if (typeof assignedTo === "string") return "Assigned";
  return assignedTo.name;
}

function getAssignedDoctorId(assignedTo?: string | PopulatedDoctor) {
  if (!assignedTo) return "";
  return typeof assignedTo === "string" ? assignedTo : assignedTo._id;
}

export function EquipmentManagement() {
  const { token, user } = useAuth();
  const toast = useToast();
  const hospitalId = user?.linkedHospitalId ?? "";

  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [page, setPage] = useState(1);
  const [equipment, setEquipment] = useState<EquipmentRecord[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [claimSelections, setClaimSelections] = useState<Record<string, string>>({});
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 8, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEquipment = async () => {
    if (!hospitalId) {
      setEquipment([]);
      setLoadError("This account is not linked to a hospital yet.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const [equipmentResponse, doctorResponse] = await Promise.all([
        equipmentService.list({
          hospitalId,
          status: filters.status || undefined,
          type: filters.type.trim() || undefined,
          hospitalSection: filters.hospitalSection.trim() || undefined,
          page,
          limit: 8,
        }),
        doctorService.listByHospital(hospitalId, 100),
      ]);

      const items = equipmentResponse.data as EquipmentRecord[];
      setEquipment(items);
      setDoctors(doctorResponse.data);
      setPagination(equipmentResponse.pagination);
      setClaimSelections((current) => {
        const next = { ...current };
        for (const item of items) {
          if (!next[item._id]) {
            next[item._id] = getAssignedDoctorId(item.assignedTo);
          }
        }
        return next;
      });
    } catch (error) {
      setLoadError(getErrorMessage(error, "Failed to load equipment"));
      toast.error("Unable to load equipment", getErrorMessage(error, "Failed to load equipment"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEquipment();
  }, [hospitalId, page, filters.status, filters.type, filters.hospitalSection]);

  useSocketEvents(
    {
      "equipment:updated": (payload) => {
        const updatedEquipment = payload as EquipmentRecord;
        const equipmentHospitalId =
          typeof updatedEquipment?.hospitalId === "string"
            ? updatedEquipment.hospitalId
            : (updatedEquipment?.hospitalId as { _id?: string } | undefined)?._id;

        if (
          !updatedEquipment?._id ||
          equipmentHospitalId !== hospitalId ||
          (filters.status && updatedEquipment.status !== filters.status) ||
          (filters.type && !updatedEquipment.type.toLowerCase().includes(filters.type.trim().toLowerCase())) ||
          (filters.hospitalSection &&
            !updatedEquipment.hospitalSection.toLowerCase().includes(filters.hospitalSection.trim().toLowerCase()))
        ) {
          return;
        }

        setEquipment((current) => {
          const exists = current.some((item) => item._id === updatedEquipment._id);

          if (!exists) {
            return current;
          }

          return current.map((item) => (item._id === updatedEquipment._id ? updatedEquipment : item));
        });

        setClaimSelections((current) => ({
          ...current,
          [updatedEquipment._id]: getAssignedDoctorId(updatedEquipment.assignedTo),
        }));
      },
    },
    Boolean(hospitalId),
  );

  const openCreatePanel = () => {
    setFormMode("create");
    setEditingEquipmentId(null);
    setForm(initialForm);
    setActionError(null);
    setPanelOpen(true);
  };

  const openEditPanel = (item: EquipmentRecord) => {
    setFormMode("edit");
    setEditingEquipmentId(item._id);
    setForm({
      name: item.name,
      type: item.type,
      status: item.status,
      hospitalSection: item.hospitalSection,
      assignedTo: getAssignedDoctorId(item.assignedTo),
    });
    setActionError(null);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingEquipmentId(null);
    setForm(initialForm);
    setActionError(null);
  };

  const handleSave = async () => {
    if (!token || !hospitalId) {
      setActionError("You must be logged in as a hospital admin to manage equipment.");
      toast.error("Equipment action failed", "You must be logged in as a hospital admin to manage equipment.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);

    const payload = {
      hospitalId,
      name: form.name.trim(),
      type: form.type.trim(),
      status: form.status,
      hospitalSection: form.hospitalSection.trim(),
      assignedTo: form.assignedTo || undefined,
    };

    try {
      if (formMode === "create") {
        await equipmentService.create(payload, token);
        setSuccessMessage("Equipment created successfully.");
        toast.success("Equipment created", "The inventory record was added successfully.");
      } else if (editingEquipmentId) {
        await equipmentService.update(editingEquipmentId, payload, token);
        setSuccessMessage("Equipment updated successfully.");
        toast.success("Equipment updated", "The inventory record was updated successfully.");
      }

      closePanel();
      await loadEquipment();
    } catch (error) {
      setActionError(getErrorMessage(error, "Unable to save equipment"));
      toast.error("Equipment action failed", getErrorMessage(error, "Unable to save equipment"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) {
      setActionError("You must be logged in to delete equipment.");
      toast.error("Delete failed", "You must be logged in to delete equipment.");
      return;
    }

    if (!window.confirm("Delete this equipment record?")) return;

    setActiveActionId(id);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await equipmentService.remove(id, token);
      setSuccessMessage("Equipment deleted successfully.");
      toast.success("Equipment deleted", "The inventory record was removed.");
      await loadEquipment();
    } catch (error) {
      setActionError(getErrorMessage(error, "Unable to delete equipment"));
      toast.error("Delete failed", getErrorMessage(error, "Unable to delete equipment"));
    } finally {
      setActiveActionId(null);
    }
  };

  const handleClaim = async (id: string) => {
    if (!token) {
      setActionError("You must be logged in to claim equipment.");
      toast.error("Claim failed", "You must be logged in to claim equipment.");
      return;
    }

    const doctorId = claimSelections[id];
    if (!doctorId) {
      setActionError("Select a doctor before claiming equipment.");
      toast.info("Select a doctor", "Choose a doctor before claiming equipment.");
      return;
    }

    setActiveActionId(id);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await equipmentService.claim(id, { doctorId }, token);
      setSuccessMessage("Equipment claimed successfully.");
      toast.success("Equipment claimed", "The equipment was assigned successfully.");
      await loadEquipment();
    } catch (error) {
      setActionError(getErrorMessage(error, "Unable to claim equipment"));
      toast.error("Claim failed", getErrorMessage(error, "Unable to claim equipment"));
    } finally {
      setActiveActionId(null);
    }
  };

  const handleRelease = async (id: string) => {
    if (!token) {
      setActionError("You must be logged in to release equipment.");
      toast.error("Release failed", "You must be logged in to release equipment.");
      return;
    }

    setActiveActionId(id);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await equipmentService.release(id, token);
      setSuccessMessage("Equipment released back to available stock.");
      toast.success("Equipment released", "The equipment is back in available stock.");
      await loadEquipment();
    } catch (error) {
      setActionError(getErrorMessage(error, "Unable to release equipment"));
      toast.error("Release failed", getErrorMessage(error, "Unable to release equipment"));
    } finally {
      setActiveActionId(null);
    }
  };

  const renderStatusBadge = (status: EquipmentStatus) => (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize", statusStyles[status])}>
      {status.replace("-", " ")}
    </span>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-[var(--border)] bg-[linear-gradient(135deg,#0f766e_0%,#134e4a_55%,#10231b_100%)] px-6 py-8 text-white shadow-[0_25px_70px_rgba(15,118,110,0.24)] sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100/90">Equipment management</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Track, assign, and maintain hospital equipment</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-teal-50/86">
              Manage inventory, keep department ownership visible, and use quick claim or release actions during live coordination.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreatePanel}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-teal-50"
          >
            <PackagePlus className="h-4 w-4" />
            Add equipment
          </button>
        </div>
      </section>

      <EquipmentFilters
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />

      {successMessage ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">{successMessage}</div>
      ) : null}
      {loadError || actionError ? (
        <ErrorState
          title={loadError ? "Unable to load equipment" : "Equipment action failed"}
          description={loadError || actionError || "Something went wrong while managing equipment."}
        />
      ) : null}

      <section className="rounded-[30px] border border-[var(--border)] bg-white/92 shadow-[0_20px_50px_rgba(16,35,27,0.06)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Equipment inventory</h2>
            <p className="text-sm text-[var(--muted)]">{pagination.total} total records for this hospital workspace.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-8">
            <LoadingState
              title="Loading equipment inventory"
              description="Fetching tracked devices, assignment data, and hospital section details."
            />
          </div>
        ) : equipment.length === 0 ? (
          <div className="px-6 py-8">
            <EmptyState
              title="No equipment found"
              description="Try adjusting the filters or add the first equipment record."
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-[var(--border)]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Section</th>
                    <th className="px-6 py-4 font-medium">Assigned doctor</th>
                    <th className="px-6 py-4 font-medium">Quick actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {equipment.map((item) => (
                    <tr key={item._id} className="align-top">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-[var(--foreground)]">{item.name}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">Created {new Date(item.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-5 text-sm text-[var(--muted)]">{item.type}</td>
                      <td className="px-6 py-5">{renderStatusBadge(item.status)}</td>
                      <td className="px-6 py-5 text-sm text-[var(--muted)]">{item.hospitalSection}</td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-[var(--foreground)]">{getAssignedDoctorName(item.assignedTo)}</p>
                        {typeof item.assignedTo === "object" && item.assignedTo ? (
                          <p className="mt-1 text-xs text-[var(--muted)]">{item.assignedTo.specialization} • {item.assignedTo.department}</p>
                        ) : null}
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-3">
                          {item.status === "available" ? (
                            <div className="flex flex-col gap-2">
                              <select
                                value={claimSelections[item._id] ?? ""}
                                onChange={(event) => setClaimSelections((current) => ({ ...current, [item._id]: event.target.value }))}
                                className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
                              >
                                <option value="">Select doctor to claim</option>
                                {doctors.map((doctor) => (
                                  <option key={doctor._id} value={doctor._id}>
                                    {doctor.name} - {doctor.specialization}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => void handleClaim(item._id)}
                                disabled={activeActionId === item._id}
                                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[rgba(16,35,27,0.04)] disabled:opacity-60"
                              >
                                Claim
                              </button>
                            </div>
                          ) : item.status === "in-use" ? (
                            <button
                              type="button"
                              onClick={() => void handleRelease(item._id)}
                              disabled={activeActionId === item._id}
                              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[rgba(16,35,27,0.04)] disabled:opacity-60"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Release
                            </button>
                          ) : (
                            <p className="text-sm text-[var(--muted)]">No quick action during maintenance.</p>
                          )}

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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {equipment.map((item) => (
                <article key={item._id} className="rounded-[24px] border border-[var(--border)] bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">{item.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{item.type}</p>
                    </div>
                    {renderStatusBadge(item.status)}
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                    <p><span className="font-medium text-[var(--foreground)]">Section:</span> {item.hospitalSection}</p>
                    <p><span className="font-medium text-[var(--foreground)]">Assigned doctor:</span> {getAssignedDoctorName(item.assignedTo)}</p>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {item.status === "available" ? (
                      <>
                        <select
                          value={claimSelections[item._id] ?? ""}
                          onChange={(event) => setClaimSelections((current) => ({ ...current, [item._id]: event.target.value }))}
                          className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
                        >
                          <option value="">Select doctor to claim</option>
                          {doctors.map((doctor) => (
                            <option key={doctor._id} value={doctor._id}>
                              {doctor.name} - {doctor.specialization}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => void handleClaim(item._id)}
                          disabled={activeActionId === item._id}
                          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[rgba(16,35,27,0.04)] disabled:opacity-60"
                        >
                          Claim
                        </button>
                      </>
                    ) : item.status === "in-use" ? (
                      <button
                        type="button"
                        onClick={() => void handleRelease(item._id)}
                        disabled={activeActionId === item._id}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[rgba(16,35,27,0.04)] disabled:opacity-60"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Release
                      </button>
                    ) : null}

                    <div className="flex gap-2">
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

      <EquipmentFormPanel
        mode={formMode}
        open={panelOpen}
        doctors={doctors}
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
