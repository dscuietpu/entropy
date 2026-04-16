import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingStateProps {
  title?: string;
  description?: string;
  fullHeight?: boolean;
  className?: string;
}

export function LoadingState({
  title = "Loading...",
  description = "Please wait while we prepare this view.",
  fullHeight = false,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[var(--border)] bg-white/92 px-6 py-14 text-center shadow-sm",
        fullHeight && "flex min-h-[60vh] items-center justify-center",
        className,
      )}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <div className="rounded-full bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
          <LoaderCircle className="h-6 w-6 animate-spin" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-[var(--foreground)]">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{description}</p>
      </div>
    </div>
  );
}
