"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToastStore, type Toast, type ToastVariant } from "@/store";

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-white text-emerald-700",
  error: "border-rose-200 bg-white text-rose-700",
  info: "border-sky-200 bg-white text-sky-700",
};

const iconMap: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((state) => state.removeToast);
  const Icon = iconMap[toast.variant];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      removeToast(toast.id);
    }, 3800);

    return () => window.clearTimeout(timeout);
  }, [removeToast, toast.id]);

  return (
    <article
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-[22px] border px-4 py-4 shadow-[0_18px_45px_rgba(16,35,27,0.08)] backdrop-blur",
        variantStyles[toast.variant],
      )}
    >
      <div className="mt-0.5 shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description ? <p className="mt-1 text-sm leading-6 text-black/70">{toast.description}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className="shrink-0 rounded-full p-1 text-black/40 transition hover:bg-black/5 hover:text-black/65"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </article>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
