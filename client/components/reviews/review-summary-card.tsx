"use client";

import { useMemo, useState } from "react";
import { Bot, LoaderCircle, Sparkles } from "lucide-react";

import { getErrorMessage } from "@/lib/utils";
import { aiService } from "@/services";
import type { Review } from "@/types";

interface ReviewSummaryCardProps {
  reviews: Review[];
}

const splitSummary = (summary: string) =>
  summary
    .split(/\r?\n+/)
    .map((line) => line.replace(/^[-*•\s]+/, "").trim())
    .filter(Boolean);

export function ReviewSummaryCard({ reviews }: ReviewSummaryCardProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reviewTexts = useMemo(
    () => reviews.map((review) => review.comment.trim()).filter(Boolean),
    [reviews],
  );

  const summaryPoints = useMemo(() => (summary ? splitSummary(summary) : []), [summary]);

  const handleSummarize = async () => {
    if (!reviewTexts.length) {
      setErrorMessage("No review text is available to summarize yet.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await aiService.summarizeReviews(reviewTexts);
      setSummary(response.summary.trim());
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to summarize reviews right now."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-[26px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,250,248,0.95))] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            <Bot className="h-3.5 w-3.5" />
            AI Review Insight
          </div>
          <h3 className="mt-3 text-lg font-semibold text-[var(--foreground)]">Summarize Reviews</h3>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Generate a quick bullet summary from recent public feedback to spot common praise and concerns faster.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSummarize}
          disabled={isLoading || !reviewTexts.length}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Summarizing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Summarize Reviews
            </>
          )}
        </button>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {summary ? (
        <div className="mt-5 rounded-[22px] border border-[var(--border)] bg-white px-5 py-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Concise summary</p>
          <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--muted)]">
            {summaryPoints.length ? (
              summaryPoints.map((point) => (
                <div key={point} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                  <p>{point}</p>
                </div>
              ))
            ) : (
              <p>{summary}</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
