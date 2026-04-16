"use client";

import { useState } from "react";
import { LoaderCircle, Star } from "lucide-react";

import { useAuth } from "@/hooks";
import { getErrorMessage } from "@/lib/utils";
import { reviewService } from "@/services";
import type { ReviewTargetType } from "@/types";

interface ReviewSubmissionFormProps {
  targetType: ReviewTargetType;
  targetId: string;
  title?: string;
  description?: string;
}

export function ReviewSubmissionForm({
  targetType,
  targetId,
  title = "Share your review",
  description = "Rate the experience and leave a short comment.",
}: ReviewSubmissionFormProps) {
  const { token } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setErrorMessage("Please log in before submitting a review.");
      return;
    }

    if (!comment.trim()) {
      setErrorMessage("Please write a short comment before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await reviewService.create(
        {
          targetType,
          targetId,
          rating,
          comment: comment.trim(),
        },
        token,
      );

      setComment("");
      setRating(5);
      setSuccessMessage("Review submitted successfully.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to submit review."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-[30px] border border-[var(--border)] bg-white/92 p-7 shadow-sm">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--primary)]">Review</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{title}</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{description}</p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Rating</label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => {
              const active = value <= rating;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-amber-200 bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--primary)]"
                  }`}
                >
                  <Star className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
                  {value}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor={`review-comment-${targetId}`}>
            Comment
          </label>
          <textarea
            id={`review-comment-${targetId}`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={`Share your experience with this ${targetType}.`}
            rows={5}
            className="w-full rounded-[24px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
          />
        </div>

        {successMessage ? (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit review"
          )}
        </button>
      </form>
    </section>
  );
}
