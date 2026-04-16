"use client";

import { useState } from "react";
import { BrainCircuit, LoaderCircle, Sparkles } from "lucide-react";

import { HospitalCard } from "@/components/hospitals/hospital-card";
import { HospitalFilters } from "@/components/hospitals/hospital-filters";
import { HospitalsPagination } from "@/components/hospitals/hospitals-pagination";
import { FadeIn } from "@/components/motion/fade-in";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getErrorMessage } from "@/lib/utils";
import { hospitalService } from "@/services";
import type { SemanticHospitalSearchResult } from "@/services/hospital.service";
import type { Hospital } from "@/types";

interface HospitalsDiscoveryProps {
  initialHospitals: Hospital[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    city?: string;
    state?: string;
    availabilityStatus?: "free" | "busy";
    search?: string;
  };
  createPageHref: (page: number) => string;
}

export function HospitalsDiscovery({
  initialHospitals,
  pagination,
  filters,
  createPageHref,
}: HospitalsDiscoveryProps) {
  const [smartQuery, setSmartQuery] = useState("");
  const [smartResults, setSmartResults] = useState<SemanticHospitalSearchResult[] | null>(null);
  const [smartError, setSmartError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const normalSearchActive = Boolean(filters.search?.trim());

  const runSmartSearch = async () => {
    if (!smartQuery.trim()) {
      setSmartError("Enter a natural language search like 'heart hospital in delhi with ICU'.");
      return;
    }

    setIsSearching(true);
    setSmartError(null);

    try {
      const results = await hospitalService.semanticSearch({
        query: smartQuery.trim(),
        filters: {
          city: filters.city?.trim() || undefined,
          state: filters.state?.trim() || undefined,
          availabilityStatus: filters.availabilityStatus || undefined,
        },
        topK: 9,
        candidateLimit: 120,
      });

      setSmartResults(results);
    } catch (error) {
      setSmartResults(null);
      setSmartError(getErrorMessage(error, "Smart search is unavailable right now."));
    } finally {
      setIsSearching(false);
    }
  };

  const clearSmartSearch = () => {
    setSmartQuery("");
    setSmartResults(null);
    setSmartError(null);
  };

  const showingSmartResults = Boolean(smartResults);
  const hospitalsToRender = showingSmartResults ? (smartResults ?? []).map((item) => item.hospital) : initialHospitals;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-20 pt-10 sm:px-8 lg:px-12">
      <section className="space-y-8 py-12 sm:py-16">
        <FadeIn>
          <SectionHeading
            eyebrow="Hospitals directory"
            title="Find hospitals by location, availability, and care focus"
            description="Use normal filters for fast browsing, or try the smart search for natural-language matching powered by semantic hospital search."
          />
        </FadeIn>

        <FadeIn delay={0.03}>
          <div className="rounded-[28px] border border-[var(--border)] bg-white/92 p-5 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[1.4fr_auto_auto]">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Smart hospital search
                </label>
                <input
                  value={smartQuery}
                  onChange={(event) => setSmartQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void runSmartSearch();
                    }
                  }}
                  placeholder="Try: hospital in delhi for cardiology with ICU and emergency support"
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => void runSmartSearch()}
                  disabled={isSearching}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:opacity-70"
                >
                  {isSearching ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="h-4 w-4" />
                      Smart Search
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearSmartSearch}
                  className="inline-flex w-full items-center justify-center rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]"
                >
                  Use Normal Listing
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              Ranked semantic results respect your city, state, and availability filters when applied.
            </div>

            {smartError ? (
              <div className="mt-4">
                <ErrorState title="Smart search unavailable" description={smartError} />
              </div>
            ) : null}
          </div>
        </FadeIn>

        <FadeIn delay={0.05}>
          <HospitalFilters
            city={filters.city}
            state={filters.state}
            availabilityStatus={filters.availabilityStatus}
            search={filters.search}
          />
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--muted)]">
              {showingSmartResults ? (
                <>
                  Showing <span className="font-semibold text-[var(--foreground)]">{hospitalsToRender.length}</span> ranked smart matches
                  {smartQuery.trim() ? (
                    <>
                      {" "}for <span className="font-semibold text-[var(--foreground)]">"{smartQuery.trim()}"</span>
                    </>
                  ) : null}
                  .
                </>
              ) : (
                <>
                  Showing <span className="font-semibold text-[var(--foreground)]">{hospitalsToRender.length}</span> hospitals on
                  this page out of{" "}
                  <span className="font-semibold text-[var(--foreground)]">{pagination.total}</span> total matches.
                </>
              )}
            </p>
            <p className="text-sm text-[var(--muted)]">
              {showingSmartResults
                ? "Sorted by semantic relevance"
                : `Page ${pagination.page} of ${pagination.totalPages}`}
            </p>
          </div>
        </FadeIn>

        {normalSearchActive && !showingSmartResults ? (
          <FadeIn delay={0.09}>
            <div className="rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm text-[var(--muted)]">
              Normal search is active and is using the specialty/treatment filter path. Use smart search above for natural-language ranking.
            </div>
          </FadeIn>
        ) : null}

        {hospitalsToRender.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {hospitalsToRender.map((hospital, index) => (
              <FadeIn key={hospital._id} delay={index * 0.04}>
                <div className="space-y-3">
                  {showingSmartResults ? (
                    <div className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                      Relevance {(((smartResults?.[index]?.similarity ?? 0) * 100)).toFixed(1)}%
                    </div>
                  ) : null}
                  <HospitalCard hospital={hospital} />
                </div>
              </FadeIn>
            ))}
          </div>
        ) : (
          <FadeIn>
            <EmptyState
              title="No hospitals found"
              description="Try changing the city, state, availability, or specialty search to broaden the results."
            />
          </FadeIn>
        )}

        {!showingSmartResults ? (
          <FadeIn delay={0.1}>
            <HospitalsPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              createPageHref={createPageHref}
            />
          </FadeIn>
        ) : null}
      </section>
    </div>
  );
}
