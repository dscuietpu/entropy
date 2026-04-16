"use client";

import { useState } from "react";
import { BrainCircuit, LoaderCircle, PhoneCall, Search, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { cn, getErrorMessage } from "@/lib/utils";
import { equipmentService } from "@/services";
import type { SemanticEquipmentSearchResult } from "@/services/equipment.service";

type StatusFilter = "" | "available" | "in-use" | "maintenance";
type SearchHospital = {
  _id?: string;
  name: string;
  city?: string;
  state?: string;
  contactNumber?: string;
  availabilityStatus?: "free" | "busy";
};

const statusStyles: Record<Exclude<StatusFilter, "">, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "in-use": "border-amber-200 bg-amber-50 text-amber-700",
  maintenance: "border-rose-200 bg-rose-50 text-rose-700",
};

function getHospitalName(result: SemanticEquipmentSearchResult) {
  const hospital = result.equipment.hospitalId as string | SearchHospital | undefined;
  if (!hospital) return "Unknown hospital";
  if (typeof hospital === "string") return "Linked hospital";
  return hospital.name;
}

function getHospitalMeta(result: SemanticEquipmentSearchResult) {
  const hospital = result.equipment.hospitalId as string | SearchHospital | undefined;
  if (!hospital || typeof hospital === "string") return "";
  return [hospital.city, hospital.state].filter(Boolean).join(", ");
}

function getHospitalContact(result: SemanticEquipmentSearchResult) {
  const hospital = result.equipment.hospitalId as string | SearchHospital | undefined;
  if (!hospital || typeof hospital === "string") return "";
  return hospital.contactNumber ?? "";
}

export function NetworkSearch() {
  const [query, setQuery] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [type, setType] = useState("");
  const [hospitalSection, setHospitalSection] = useState("");
  const [status, setStatus] = useState<StatusFilter>("available");
  const [results, setResults] = useState<SemanticEquipmentSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = async () => {
    if (!query.trim()) {
      setError("Enter an equipment need before searching the hospital network.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await equipmentService.semanticSearch({
        query: query.trim(),
        filters: {
          hospitalId: hospitalId.trim() || undefined,
          status: status || undefined,
          type: type.trim() || undefined,
          hospitalSection: hospitalSection.trim() || undefined,
        },
        topK: 12,
        candidateLimit: 120,
      });

      setResults(response);
    } catch (searchError) {
      setResults([]);
      setError(getErrorMessage(searchError, "Unable to search the network right now."));
    } finally {
      setIsLoading(false);
    }
  };

  const resetSmartSearch = () => {
    setQuery("");
    setHospitalId("");
    setType("");
    setHospitalSection("");
    setStatus("available");
    setResults([]);
    setError(null);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-[var(--border)] bg-[linear-gradient(135deg,#0f766e_0%,#134e4a_55%,#10231b_100%)] px-6 py-8 text-white shadow-[0_25px_70px_rgba(15,118,110,0.24)] sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100/90">Hospital network</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Search nearby hospital inventory and support capacity
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-teal-50/86">
              Use natural language equipment search to discover support across hospitals, then narrow the ranked results with direct operational filters like status, section, and hospital ID.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.22em] text-teal-100/80">AI ready</p>
            <p className="mt-2 text-lg font-semibold">Semantic equipment search enabled</p>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--border)] bg-white/92 p-6 shadow-[0_20px_50px_rgba(16,35,27,0.06)]">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr_0.8fr_0.8fr_0.8fr_auto_auto]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">Natural language search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void runSearch();
                  }
                }}
                placeholder="Try: ventilator for ICU, emergency oxygen support, portable monitor for surgery..."
                className="w-full rounded-2xl border border-[var(--border)] bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">Hospital ID</span>
            <input
              value={hospitalId}
              onChange={(event) => setHospitalId(event.target.value)}
              placeholder="Optional hospitalId"
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">Type</span>
            <input
              value={type}
              onChange={(event) => setType(event.target.value)}
              placeholder="Ventilator"
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">Section</span>
            <input
              value={hospitalSection}
              onChange={(event) => setHospitalSection(event.target.value)}
              placeholder="ICU"
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              <option value="">All statuses</option>
              <option value="available">Available</option>
              <option value="in-use">In use</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <BrainCircuit className="h-4 w-4" />
                  Search network
                </>
              )}
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetSmartSearch}
              className="inline-flex w-full items-center justify-center rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          Smart search enhances the network view with ranked matches. The filters below still shape and narrow the final result set instead of being replaced.
        </div>
      </section>

      {error ? (
        <ErrorState title="Network search unavailable" description={error} />
      ) : null}

      <section className="rounded-[30px] border border-[var(--border)] bg-white/92 shadow-[0_20px_50px_rgba(16,35,27,0.06)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Network results</h2>
            <p className="text-sm text-[var(--muted)]">
              {hasSearched
                ? `${results.length} ranked equipment matches across hospitals.`
                : "Run a smart search to see cross-hospital equipment results."}
            </p>
          </div>
        </div>

        {!hasSearched ? (
          <div className="px-6 py-8">
            <EmptyState
              title="Start with a natural language request"
              description="Search for devices, sections, support needs, or combine that with hospital-specific filters to explore the network."
            />
          </div>
        ) : isLoading ? (
          <div className="px-6 py-8">
            <LoadingState
              title="Searching hospital network"
              description="Ranking equipment matches across hospitals using semantic search and your current filters."
            />
          </div>
        ) : results.length === 0 && !isLoading ? (
          <div className="px-6 py-8">
            <EmptyState
              title="No matching equipment found"
              description="Try a broader query or remove one of the filters to widen the network search."
            />
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-2">
            {results.map((result, index) => {
              const equipment = result.equipment;
              const statusValue = equipment.status;
              const hospitalContact = getHospitalContact(result);

              return (
                <article key={`${equipment._id}-${index}`} className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[0_14px_32px_rgba(16,35,27,0.05)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                        {getHospitalName(result)}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">{equipment.name}</h3>
                    </div>
                    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize", statusValue ? statusStyles[statusValue] : "border-[var(--border)] bg-white text-[var(--muted)]")}>
                      {statusValue.replace("-", " ")}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
                    <p><span className="font-medium text-[var(--foreground)]">Type:</span> {equipment.type}</p>
                    <p><span className="font-medium text-[var(--foreground)]">Section:</span> {equipment.hospitalSection}</p>
                    <p><span className="font-medium text-[var(--foreground)]">Hospital:</span> {getHospitalMeta(result) || "Location not available"}</p>
                    <p><span className="font-medium text-[var(--foreground)]">Semantic rank:</span> {(result.similarity * 100).toFixed(1)}%</p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
                    >
                      Request Equipment
                    </button>
                    <a
                      href={hospitalContact ? `tel:${hospitalContact}` : "#"}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                        hospitalContact
                          ? "border-[var(--border)] text-[var(--foreground)] hover:bg-[rgba(16,35,27,0.04)]"
                          : "cursor-not-allowed border-[var(--border)] text-[var(--muted)] opacity-70",
                      )}
                    >
                      <PhoneCall className="h-4 w-4" />
                      Contact Hospital
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
