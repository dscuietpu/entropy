import Link from "next/link";
import { ArrowLeft, CalendarCheck2, MapPin, MessageSquareMore, Phone, Siren, Star } from "lucide-react";

import { DoctorList } from "@/components/doctors/doctor-list";
import { ReviewSummaryCard } from "@/components/reviews/review-summary-card";
import { ReviewSubmissionForm } from "@/components/reviews/review-submission-form";
import { doctorService, hospitalService, reviewService } from "@/services";
import type { ReviewAuthorPreview } from "@/types";

export const dynamic = "force-dynamic";

interface HospitalDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const getAuthorName = (createdBy?: string | ReviewAuthorPreview) => {
  if (!createdBy) {
    return "Anonymous user";
  }

  if (typeof createdBy === "string") {
    return "Patient review";
  }

  return createdBy.name;
};

export default async function HospitalDetailPage({ params }: HospitalDetailPageProps) {
  const { id } = await params;

  const [hospital, doctorsResponse, reviewsResponse] = await Promise.all([
    hospitalService.getById(id),
    doctorService.listByHospital(id, 6),
    reviewService.listForHospital(id, 6),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-20 pt-10 sm:px-8 lg:px-12">
      <div className="space-y-8 py-12">
        <Link
          href="/hospitals"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to hospitals
        </Link>

        <section className="overflow-hidden rounded-[34px] border border-[var(--border)] bg-white/92 shadow-[var(--shadow)]">
          <div className="border-b border-[var(--border)] bg-[linear-gradient(140deg,rgba(10,32,28,0.98),rgba(15,118,110,0.94))] px-8 py-10 text-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-teal-200">
                  {hospital.availabilityStatus === "free" ? "Open for coordination" : "Currently busy"}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">{hospital.name}</h1>
                <p className="mt-4 text-sm leading-8 text-white/78">{hospital.description}</p>
                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/75">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {hospital.address}, {hospital.city}, {hospital.state}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {hospital.contactNumber}
                  </span>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/12 bg-white/8 p-5 backdrop-blur">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-amber-200">
                  <Star className="h-4 w-4 fill-current" />
                  {hospital.averageRating.toFixed(1)} average rating
                </div>
                <p className="mt-4 text-sm leading-7 text-white/72">
                  Emergency contact: {hospital.emergencyContact}
                </p>
                <p className="mt-2 text-sm leading-7 text-white/72">
                  Departments: {hospital.departments.length}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 px-8 py-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <section>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Specialties</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {hospital.specialties.length ? (
                    hospital.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--foreground)]"
                      >
                        {specialty}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--muted)]">Specialties will appear here soon.</p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Facilities</h2>
                <p className="mt-4 text-sm leading-8 text-[var(--muted)]">
                  {hospital.facilities.length ? hospital.facilities.join(", ") : "Facilities not listed yet."}
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Departments</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {hospital.departments.length ? (
                    hospital.departments.map((department) => (
                      <span
                        key={department}
                        className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--muted)]"
                      >
                        {department}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--muted)]">Departments not listed yet.</p>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <a
                href="/login"
                className="flex items-center justify-between rounded-[26px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition hover:border-[var(--primary)]"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Book Appointment</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Continue to doctor booking flow</p>
                </div>
                <CalendarCheck2 className="h-5 w-5 text-[var(--primary)]" />
              </a>

              <a
                href="/login"
                className="flex items-center justify-between rounded-[26px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition hover:border-[var(--primary)]"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Chat with Hospital</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Start a support conversation</p>
                </div>
                <MessageSquareMore className="h-5 w-5 text-[var(--primary)]" />
              </a>

              <a
                href="/login"
                className="flex items-center justify-between rounded-[26px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition hover:border-[var(--primary)]"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Raise Issue</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Report shortage or support need</p>
                </div>
                <Siren className="h-5 w-5 text-[var(--primary)]" />
              </a>
            </aside>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[30px] border border-[var(--border)] bg-white/92 p-7 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--primary)]">Doctors</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Doctors at this hospital</h2>
              </div>
              <p className="text-sm text-[var(--muted)]">{doctorsResponse.pagination.total} listed</p>
            </div>

            <div className="mt-6 space-y-4">
              <DoctorList doctors={doctorsResponse.data} />
            </div>
          </div>

          <div className="rounded-[30px] border border-[var(--border)] bg-white/92 p-7 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--primary)]">Reviews</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Recent public feedback</h2>
              </div>
              <p className="text-sm text-[var(--muted)]">{reviewsResponse.pagination.total} reviews</p>
            </div>

            <div className="mt-6 space-y-4">
              <ReviewSummaryCard reviews={reviewsResponse.data} />

              {reviewsResponse.data.length ? (
                reviewsResponse.data.map((review) => (
                  <article key={review._id} className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-[var(--foreground)]">
                          {getAuthorName(review.createdBy)}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--accent)]">
                        <Star className="h-4 w-4 fill-current" />
                        {review.rating.toFixed(1)}
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-8 text-[var(--muted)]">{review.comment}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-7 text-[var(--muted)]">No reviews have been posted for this hospital yet.</p>
              )}
            </div>
          </div>
        </section>

        <ReviewSubmissionForm
          targetType="hospital"
          targetId={hospital._id}
          title="Write a hospital review"
          description="This reusable review form supports hospital and doctor feedback, so we can place it in both contexts as the frontend expands."
        />
      </div>
    </div>
  );
}
