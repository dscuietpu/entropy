import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";

export function CtaBanner() {
  return (
    <FadeIn>
      <div className="flex flex-col gap-6 rounded-[32px] border border-[var(--border)] bg-white/90 p-8 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--primary)]">Get started</p>
          <h3 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Explore the network or jump straight into hospital operations.
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            This landing page is the clean public entry point. From here, we can keep expanding public
            discovery and the hospital-side dashboard block by block.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/hospitals"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]"
          >
            Explore Hospitals
          </Link>
          <Link
            href="/hospital/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
          >
            Hospital Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </FadeIn>
  );
}
