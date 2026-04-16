import Link from "next/link";
import { ArrowUpRight, MapPin, Star } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import type { Hospital } from "@/types";

interface HospitalCardProps {
  hospital: Hospital;
}

export function HospitalCard({ hospital }: HospitalCardProps) {
  return (
    <Link
      href={`/hospitals/${hospital._id}`}
      className="surface-card group flex h-full flex-col rounded-[30px] p-6 transition hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-[0_24px_60px_rgba(15,118,110,0.14)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <StatusBadge
            label={hospital.availabilityStatus === "free" ? "Available" : "Busy"}
            tone={hospital.availabilityStatus === "free" ? "success" : "warning"}
          />
          <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">{hospital.name}</h3>
          <div className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]">
            <MapPin className="h-4 w-4" />
            <span>
              {hospital.city}, {hospital.state}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)] shadow-sm">
          <Star className="h-4 w-4 fill-current" />
          {hospital.averageRating.toFixed(1)}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Specialties</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {hospital.specialties.length ? (
              hospital.specialties.slice(0, 4).map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--foreground)]"
                >
                  {specialty}
                </span>
              ))
            ) : (
              <span className="text-sm text-[var(--muted)]">No specialties listed yet.</span>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Facilities</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            {hospital.facilities.length ? hospital.facilities.slice(0, 5).join(", ") : "Facilities not added yet."}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
        View hospital details
        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}
