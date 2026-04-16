import { CalendarDays, CircleAlert, Images, Paperclip } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import type { Issue } from "@/types";

interface IssueCardProps {
  issue: Issue;
}

const statusStyles: Record<string, string> = {
  open: "danger",
  "in-progress": "warning",
  resolved: "success",
};

export function IssueCard({ issue }: IssueCardProps) {
  const attachments = issue.attachments ?? [];
  const previewAttachments = attachments.slice(0, 3);

  return (
    <article className="surface-card rounded-[30px] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--primary)]">{issue.issueType.replace("-", " ")}</p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">{issue.title}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            <span className="inline-flex items-center gap-2">
              <CircleAlert className="h-4 w-4" />
              {issue.roleType}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {new Date(issue.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <StatusBadge
          label={issue.status}
          tone={(statusStyles[issue.status] as "danger" | "warning" | "success" | undefined) ?? "neutral"}
        />
      </div>

      <p className="mt-4 text-sm leading-8 text-[var(--muted)]">{issue.description}</p>

      {previewAttachments.length ? (
        <div className="mt-5 space-y-3">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <Paperclip className="h-4 w-4 text-[var(--primary)]" />
            Attachments ({attachments.length})
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {previewAttachments.map((attachment) => {
              const isImage = attachment.resourceType === "image";

              return isImage ? (
                <a
                  key={attachment.publicId}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={attachment.url} alt={attachment.originalName || issue.title} className="h-32 w-full object-cover" />
                </a>
              ) : (
                <a
                  key={attachment.publicId}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-32 flex-col items-center justify-center rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-4 text-center"
                >
                  <Images className="h-5 w-5 text-[var(--primary)]" />
                  <p className="mt-3 text-xs font-medium text-[var(--muted)]">
                    {attachment.originalName || attachment.publicId}
                  </p>
                </a>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}
