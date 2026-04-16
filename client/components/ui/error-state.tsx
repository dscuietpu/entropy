"use client";

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description: string;
  action?: ReactNode;
}

export function ErrorState({
  title = "We hit a small problem",
  description,
  action,
}: ErrorStateProps) {
  return (
    <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-10 text-center shadow-sm">
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <div className="rounded-full bg-white p-3 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-rose-900">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-rose-800/90">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
