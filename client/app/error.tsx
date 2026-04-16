"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-20 pt-10 sm:px-8 lg:px-12">
      <div className="py-12 sm:py-16">
        <ErrorState
          title="Unable to load this page"
          description={error.message || "Something went wrong while loading this page."}
          action={
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Try again
            </button>
          }
        />
      </div>
    </div>
  );
}
