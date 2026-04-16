"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { IssuesManagementFilters } from "@/components/issues/issues-management-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { cn, getErrorMessage } from "@/lib/utils";
import { useAuth, useSocketEvents, useToast } from "@/hooks";
import { issueService } from "@/services";
import type { Issue, IssueStatus, IssueType } from "@/types";

const statusStyles: Record<IssueStatus, string> = {
  open: "border-amber-200 bg-amber-50 text-amber-700",
  "in-progress": "border-sky-200 bg-sky-50 text-sky-700",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const issueTypeLabels: Record<IssueType, string> = {
  "public-help": "Public help",
  "equipment-shortage": "Equipment shortage",
  "ambulance-request": "Ambulance request",
  general: "General",
};

function formatIssueType(type: IssueType) {
  return issueTypeLabels[type] ?? type;
}

export function IssuesManagement() {
  const { token, user } = useAuth();
  const toast = useToast();
  const hospitalId = user?.linkedHospitalId ?? "";

  const [status, setStatus] = useState<"" | IssueStatus>("");
  const [issueType, setIssueType] = useState<"" | IssueType>("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 8, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const loadIssues = async () => {
    if (!hospitalId) {
      setIssues([]);
      setLoadError("This account is not linked to a hospital yet.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await issueService.list({
        hospitalId,
        status: status || undefined,
        issueType: issueType || undefined,
        page,
        limit: 8,
      });

      setIssues(response.data);
      setPagination(response.pagination);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Failed to load issues"));
      toast.error("Unable to load issues", getErrorMessage(error, "Failed to load issues"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadIssues();
  }, [hospitalId, status, issueType, page]);

  useSocketEvents(
    {
      "issue:created": (payload) => {
        const nextIssue = payload as Issue;

        if (
          !nextIssue?._id ||
          nextIssue.hospitalId !== hospitalId ||
          (status && nextIssue.status !== status) ||
          (issueType && nextIssue.issueType !== issueType)
        ) {
          return;
        }

        setIssues((current) => {
          if (current.some((item) => item._id === nextIssue._id)) {
            return current;
          }

          return [nextIssue, ...current].slice(0, pagination.limit);
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

        const matchesCurrentFilters =
          updatedIssue.hospitalId === hospitalId &&
          (!status || updatedIssue.status === status) &&
          (!issueType || updatedIssue.issueType === issueType);

        setIssues((current) => {
          const exists = current.some((item) => item._id === updatedIssue._id);

          if (!matchesCurrentFilters) {
            return current.filter((item) => item._id !== updatedIssue._id);
          }

          if (!exists) {
            return current;
          }

          return current.map((item) => (item._id === updatedIssue._id ? updatedIssue : item));
        });

      },
    },
    Boolean(hospitalId),
  );

  const handleStatusAction = async (issueId: string, nextStatus: IssueStatus) => {
    if (!token) {
      setActionError("You must be logged in to update issues.");
      toast.error("Issue update failed", "You must be logged in to update issues.");
      return;
    }

    setActiveActionId(issueId);
    setActionError(null);
    setSuccessMessage(null);

    const payload =
      nextStatus === "resolved"
        ? {
            status: nextStatus,
            resolvedBy: user?.id,
            resolvedAt: new Date().toISOString(),
          }
        : {
            status: nextStatus,
          };

    try {
      await issueService.update(issueId, payload, token);
      setSuccessMessage(`Issue marked ${nextStatus}.`);
      toast.success("Issue updated", `Issue marked ${nextStatus}.`);
      await loadIssues();
    } catch (error) {
      setActionError(getErrorMessage(error, "Unable to update issue status"));
      toast.error("Issue update failed", getErrorMessage(error, "Unable to update issue status"));
    } finally {
      setActiveActionId(null);
    }
  };

  const renderAttachmentPreview = (issue: Issue) => {
    if (!issue.attachments?.length) {
      return <p className="text-sm text-[var(--muted)]">No attachments</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {issue.attachments.slice(0, 3).map((attachment) =>
          attachment.resourceType === "image" ? (
            <img
              key={attachment.publicId}
              src={attachment.url}
              alt={attachment.originalName || "Issue attachment"}
              className="h-16 w-16 rounded-2xl border border-[var(--border)] object-cover"
            />
          ) : (
            <a
              key={attachment.publicId}
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium text-[var(--foreground)]"
            >
              {attachment.resourceType === "video" ? "Video" : "File"}
            </a>
          ),
        )}
        {issue.attachments.length > 3 ? (
          <span className="inline-flex items-center rounded-2xl bg-[rgba(16,35,27,0.05)] px-3 py-2 text-xs font-medium text-[var(--muted)]">
            +{issue.attachments.length - 3} more
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-[var(--border)] bg-[linear-gradient(135deg,#0f766e_0%,#134e4a_55%,#10231b_100%)] px-6 py-8 text-white shadow-[0_25px_70px_rgba(15,118,110,0.24)] sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100/90">Issues management</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Monitor and resolve hospital issue flow</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-teal-50/86">
              Track shortage reports, public help requests, and ambulance-related issues from one dashboard-friendly resolution queue.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 text-sm text-white/88 backdrop-blur">
            {pagination.total} issues in this hospital queue
          </div>
        </div>
      </section>

      <IssuesManagementFilters
        status={status}
        issueType={issueType}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onIssueTypeChange={(value) => {
          setIssueType(value);
          setPage(1);
        }}
      />

      {successMessage ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}
      {loadError || actionError ? (
        <ErrorState
          title={loadError ? "Unable to load issues" : "Issue update failed"}
          description={loadError || actionError || "Something went wrong while managing issues."}
        />
      ) : null}

      <section className="rounded-[30px] border border-[var(--border)] bg-white/92 shadow-[0_20px_50px_rgba(16,35,27,0.06)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Issue resolution board</h2>
            <p className="text-sm text-[var(--muted)]">Newest issues appear first for faster action.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-8">
            <LoadingState
              title="Loading issues"
              description="Fetching the latest public help requests, shortage updates, and resolution status."
            />
          </div>
        ) : issues.length === 0 ? (
          <div className="px-6 py-8">
            <EmptyState
              title="No issues found"
              description="Try another status or issue type filter."
            />
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-2">
            {issues.map((issue) => (
              <article key={issue._id} className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[0_14px_32px_rgba(16,35,27,0.05)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                      {formatIssueType(issue.issueType)}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">{issue.title}</h3>
                  </div>
                  <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize", statusStyles[issue.status])}>
                    {issue.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[var(--muted)]">
                  <span className="rounded-full bg-[rgba(16,35,27,0.05)] px-3 py-1 capitalize">
                    Role: {issue.roleType}
                  </span>
                  <span className="rounded-full bg-[rgba(16,35,27,0.05)] px-3 py-1">
                    {new Date(issue.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{issue.description}</p>

                <div className="mt-5">
                  <p className="mb-3 text-sm font-medium text-[var(--foreground)]">Attachments</p>
                  {renderAttachmentPreview(issue)}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {issue.status !== "in-progress" ? (
                    <button
                      type="button"
                      onClick={() => void handleStatusAction(issue._id, "in-progress")}
                      disabled={activeActionId === issue._id}
                      className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Mark in progress
                    </button>
                  ) : null}

                  {issue.status !== "resolved" ? (
                    <button
                      type="button"
                      onClick={() => void handleStatusAction(issue._id, "resolved")}
                      disabled={activeActionId === issue._id}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                    >
                      Mark resolved
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
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
    </div>
  );
}
