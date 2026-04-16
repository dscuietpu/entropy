"use client";

import { useState } from "react";
import { BrainCircuit, LoaderCircle, Sparkles } from "lucide-react";

import { MedicalShopCard } from "@/components/medical-shops/medical-shop-card";
import { MedicalShopFilters } from "@/components/medical-shops/medical-shop-filters";
import { MedicalShopsPagination } from "@/components/medical-shops/medical-shops-pagination";
import { FadeIn } from "@/components/motion/fade-in";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getErrorMessage } from "@/lib/utils";
import { medicalShopService } from "@/services";
import type { MedicalShop } from "@/types";
import type { SemanticMedicalShopSearchResult } from "@/services/medical-shop.service";

interface MedicalShopsDiscoveryProps {
  initialShops: MedicalShop[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    city?: string;
    state?: string;
    area?: string;
  };
  createPageHref: (page: number) => string;
}

export function MedicalShopsDiscovery({
  initialShops,
  pagination,
  filters,
  createPageHref,
}: MedicalShopsDiscoveryProps) {
  const [smartQuery, setSmartQuery] = useState("");
  const [smartResults, setSmartResults] = useState<SemanticMedicalShopSearchResult[] | null>(null);
  const [smartError, setSmartError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const runSmartSearch = async () => {
    if (!smartQuery.trim()) {
      setSmartError("Enter a natural language search like 'pharmacy in delhi with insulin and antibiotics'.");
      return;
    }

    setIsSearching(true);
    setSmartError(null);

    try {
      const results = await medicalShopService.semanticSearch({
        query: smartQuery.trim(),
        filters: {
          city: filters.city?.trim() || undefined,
          state: filters.state?.trim() || undefined,
          area: filters.area?.trim() || undefined,
        },
        topK: 9,
        candidateLimit: 120,
      });

      setSmartResults(results);
    } catch (error) {
      setSmartResults(null);
      setSmartError(getErrorMessage(error, "Smart medical shop search is unavailable right now."));
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
  const shopsToRender = showingSmartResults ? (smartResults ?? []).map((item) => item.medicalShop) : initialShops;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-20 pt-10 sm:px-8 lg:px-12">
      <section className="space-y-8 py-12 sm:py-16">
        <FadeIn>
          <SectionHeading
            eyebrow="Medical shops"
            title="Find nearby medical shops with smart and structured search"
            description="Use city, state, and area filters for direct browsing, or try natural-language search for ranked pharmacy matches."
          />
        </FadeIn>

        <FadeIn delay={0.03}>
          <div className="rounded-[28px] border border-[var(--border)] bg-white/92 p-5 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[1.4fr_auto_auto]">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Smart medical shop search
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
                  placeholder="Try: pharmacy in noida with insulin, pain relief, and antibiotics"
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
              Smart search enhances the existing filters and shows ranked pharmacy matches by semantic relevance.
            </div>

            {smartError ? (
              <div className="mt-4">
                <ErrorState title="Smart medical shop search unavailable" description={smartError} />
              </div>
            ) : null}
          </div>
        </FadeIn>

        <FadeIn delay={0.05}>
          <MedicalShopFilters city={filters.city} state={filters.state} area={filters.area} />
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--muted)]">
              {showingSmartResults ? (
                <>
                  Showing <span className="font-semibold text-[var(--foreground)]">{shopsToRender.length}</span> ranked medical shop matches
                  {smartQuery.trim() ? (
                    <>
                      {" "}for <span className="font-semibold text-[var(--foreground)]">"{smartQuery.trim()}"</span>
                    </>
                  ) : null}
                  .
                </>
              ) : (
                <>
                  Showing <span className="font-semibold text-[var(--foreground)]">{shopsToRender.length}</span> shops on
                  this page out of <span className="font-semibold text-[var(--foreground)]">{pagination.total}</span>{" "}
                  total results.
                </>
              )}
            </p>
            <p className="text-sm text-[var(--muted)]">
              {showingSmartResults ? "Sorted by semantic relevance" : `Page ${pagination.page} of ${pagination.totalPages}`}
            </p>
          </div>
        </FadeIn>

        {shopsToRender.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {shopsToRender.map((shop, index) => (
              <FadeIn key={shop._id} delay={index * 0.04}>
                <div className="space-y-3">
                  {showingSmartResults ? (
                    <div className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                      Relevance {(((smartResults?.[index]?.similarity ?? 0) * 100)).toFixed(1)}%
                    </div>
                  ) : null}
                  <MedicalShopCard shop={shop} />
                </div>
              </FadeIn>
            ))}
          </div>
        ) : (
          <FadeIn>
            <EmptyState
              title="No medical shops found"
              description="Try adjusting the city, state, or area filters to broaden the results."
            />
          </FadeIn>
        )}

        {!showingSmartResults ? (
          <FadeIn delay={0.1}>
            <MedicalShopsPagination
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
