"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Siren } from "lucide-react";

import { IssueCard } from "@/components/issues/issue-card";
import { IssueFilters } from "@/components/issues/issue-filters";
import { IssuesPagination } from "@/components/issues/issues-pagination";
import { FadeIn } from "@/components/motion/fade-in";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSocketEvents } from "@/hooks";
import type { Issue } from "@/types";

interface PublicIssuesFeedProps {
  initialIssues: Issue[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    status?: "open" | "in-progress" | "resolved";
    issueType?: "public-help" | "equipment-shortage" | "ambulance-request" | "general";
    roleType?: "patient" | "hospital";
  };
  createPageHref: (page: number) => string;
}

function matchesFilters(
  issue: Issue,
  filters: PublicIssuesFeedProps["filters"],
) {
  if (filters.status && issue.status !== filters.status) return false;
  if (filters.issueType && issue.issueType !== filters.issueType) return false;
  if (filters.roleType && issue.roleType !== filters.roleType) return false;
  return true;
}

export function PublicIssuesFeed({
  initialIssues,
  pagination: initialPagination,
  filters,
  createPageHref,
}: PublicIssuesFeedProps) {
  const [issues, setIssues] = useState(initialIssues);
  const [pagination, setPagination] = useState(initialPagination);

  useSocketEvents({
    "issue:created": (payload) => {
      const nextIssue = payload as Issue;

      if (!nextIssue?._id || !matchesFilters(nextIssue, filters)) {
        return;
      }

      setIssues((current) => {
        if (current.some((item) => item._id === nextIssue._id)) {
          return current;
        }

        return [nextIssue, ...current].slice(0, initialPagination.limit);
      });

      setPagination((current) => ({
        ...current,
        total: current.total + 1,
        totalPages: Math.max(1, Math.ceil((current.total + 1) / current.limit)),
      }));
    },
    "issue:updated": (payload) => {
      const updatedIssue = payload as Issue;
      if (!updatedIssue?._id) {
        return;
      }

      const shouldInclude = matchesFilters(updatedIssue, filters);

      setIssues((current) => {
        const exists = current.some((item) => item._id === updatedIssue._id);

        if (!shouldInclude) {
          return current.filter((item) => item._id !== updatedIssue._id);
        }

        if (!exists) {
          return current;
        }

        return current.map((item) => (item._id === updatedIssue._id ? updatedIssue : item));
      });

    },
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-20 pt-10 sm:px-8 lg:px-12">
      <section className="space-y-8 py-12 sm:py-16">
        <FadeIn>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
                <Siren className="h-6 w-6" />
              </div>
              <SectionHeading
                eyebrow="Public issues feed"
                title="Track public help requests, shortages, and hospital-side updates"
                description="This feed surfaces urgent operational issues so patients and hospitals can see what needs attention across the network."
              />
            </div>

            <Link
              href="/issues/new"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
            >
              <Plus className="h-4 w-4" />
              Create New Issue
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.05}>
          <IssueFilters status={filters.status} issueType={filters.issueType} roleType={filters.roleType} />
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--muted)]">
              Showing <span className="font-semibold text-[var(--foreground)]">{issues.length}</span> issues on
              this page out of <span className="font-semibold text-[var(--foreground)]">{pagination.total}</span>{" "}
              total results.
            </p>
            <p className="text-sm text-[var(--muted)]">
              Page {pagination.page} of {pagination.totalPages}
            </p>
          </div>
        </FadeIn>

        {issues.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {issues.map((issue, index) => (
              <FadeIn key={issue._id} delay={index * 0.04}>
                <IssueCard issue={issue} />
              </FadeIn>
            ))}
          </div>
        ) : (
          <FadeIn>
            <EmptyState
              title="No issues found"
              description="Try adjusting the status, issue type, or role type filters to see more records."
            />
          </FadeIn>
        )}

        <FadeIn delay={0.1}>
          <IssuesPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            createPageHref={createPageHref}
          />
        </FadeIn>
      </section>
    </div>
  );
}
