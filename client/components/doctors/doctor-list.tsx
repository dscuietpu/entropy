import type { Doctor } from "@/types";

import { DoctorCard } from "@/components/doctors/doctor-card";
import { EmptyState } from "@/components/ui/empty-state";

interface DoctorListProps {
  doctors: Doctor[];
  isLoading?: boolean;
  emptyMessage?: string;
}

function DoctorCardSkeleton() {
  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="animate-pulse space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="h-4 w-40 rounded-full bg-[var(--foreground)]/10" />
            <div className="h-3 w-48 rounded-full bg-[var(--foreground)]/8" />
          </div>
          <div className="h-6 w-24 rounded-full bg-[var(--foreground)]/8" />
        </div>
        <div className="flex gap-3">
          <div className="h-3 w-24 rounded-full bg-[var(--foreground)]/8" />
          <div className="h-3 w-20 rounded-full bg-[var(--foreground)]/8" />
        </div>
      </div>
    </div>
  );
}

export function DoctorList({
  doctors,
  isLoading = false,
  emptyMessage = "No doctors have been added for this hospital yet.",
}: DoctorListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <DoctorCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!doctors.length) {
    return <EmptyState title="No doctors listed yet" description={emptyMessage} />;
  }

  return (
    <div className="space-y-4">
      {doctors.map((doctor) => (
        <DoctorCard key={doctor._id} doctor={doctor} />
      ))}
    </div>
  );
}
