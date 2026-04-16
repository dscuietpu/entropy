"use client";

import { useToastStore } from "@/store";

export function useToast() {
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);

  return {
    show: addToast,
    remove: removeToast,
    success: (title: string, description?: string) =>
      addToast({ title, description, variant: "success" }),
    error: (title: string, description?: string) =>
      addToast({ title, description, variant: "error" }),
    info: (title: string, description?: string) =>
      addToast({ title, description, variant: "info" }),
  };
}
