import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-white/92 p-10 text-center shadow-sm">
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <div className="rounded-full bg-[var(--card)] p-3 text-[var(--muted)]">
          <Inbox className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-[var(--foreground)]">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
