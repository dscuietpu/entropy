import Link from "next/link";
import { ArrowRight, BrainCircuit, Building2, HeartHandshake, ShieldPlus, Sparkles } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { Pill } from "@/components/ui/pill";

const statItems = [
  { value: "2", label: "Primary user roles" },
  { value: "10+", label: "Core coordination modules" },
  { value: "AI + Realtime", label: "Smart search and live updates" },
];

const spotlightItems = [
  "Search hospitals by location, treatment, doctors, and facilities",
  "Coordinate equipment, issues, and ambulance help across hospitals",
  "Keep AI assistive so the core platform still works if models fail",
];

export function HeroSection() {
  return (
    <section className="grid gap-12 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-24">
      <FadeIn className="space-y-8">
        <Pill label="Hackathon-ready healthcare platform" />
        <div className="space-y-5">
          <h1 className="text-balance text-5xl font-semibold tracking-tight text-[var(--foreground)] sm:text-6xl">
            One platform for patients, hospitals, equipment, and urgent care coordination.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--muted)] sm:text-xl">
            CareBridge AI helps people discover care faster and gives hospitals a cleaner way to
            manage doctors, ambulances, equipment shortages, and live support workflows.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/hospitals"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(16,35,27,0.14)] transition hover:bg-[#163126]"
          >
            Explore Hospitals
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/hospital/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(16,35,27,0.12)] bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)]"
          >
            Hospital Dashboard
            <Building2 className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-[rgba(16,35,27,0.08)] bg-white p-5 shadow-[0_16px_35px_rgba(16,35,27,0.05)]"
            >
              <p className="text-2xl font-semibold text-[var(--foreground)]">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.label}</p>
            </div>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="relative overflow-hidden rounded-[36px] border border-[rgba(16,35,27,0.08)] bg-[linear-gradient(150deg,#ffffff_0%,#f6fbfa_48%,#fff8ee_100%)] p-7 shadow-[0_28px_70px_rgba(16,35,27,0.09)]">
          <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(13,148,136,0.16),transparent_65%)]" />
          <div className="relative space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[var(--foreground)]/6 p-3 text-[var(--primary)]">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--muted)]">
                  Project vision
                </p>
                <p className="text-xl font-semibold text-[var(--foreground)]">
                  AI-powered coordination, not just directory search
                </p>
              </div>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-white/80 bg-white/88 p-5 backdrop-blur-sm">
              {spotlightItems.map((item, index) => {
                const Icon = [ShieldPlus, Sparkles, BrainCircuit][index];

                return (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 rounded-xl bg-[var(--accent-soft)] p-2 text-[var(--accent)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-7 text-[var(--muted)]">{item}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
