import type { IssueType } from "@/types";

interface IssuesManagementFiltersProps {
  status: "" | "open" | "in-progress" | "resolved";
  issueType: "" | IssueType;
  onStatusChange: (value: "" | "open" | "in-progress" | "resolved") => void;
  onIssueTypeChange: (value: "" | IssueType) => void;
}

export function IssuesManagementFilters({
  status,
  issueType,
  onStatusChange,
  onIssueTypeChange,
}: IssuesManagementFiltersProps) {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-white/90 p-5 shadow-[0_18px_40px_rgba(16,35,27,0.05)]">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">Status</span>
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value as IssuesManagementFiltersProps["status"])}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">Issue type</span>
          <select
            value={issueType}
            onChange={(event) => onIssueTypeChange(event.target.value as IssuesManagementFiltersProps["issueType"])}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
          >
            <option value="">All issue types</option>
            <option value="public-help">Public help</option>
            <option value="equipment-shortage">Equipment shortage</option>
            <option value="ambulance-request">Ambulance request</option>
            <option value="general">General</option>
          </select>
        </label>
      </div>
    </section>
  );
}
