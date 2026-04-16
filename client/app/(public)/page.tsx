import { ArrowRight, BrainCircuit, MapPinned, ShieldCheck, Stethoscope } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { Pill } from "@/components/ui/pill";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

const highlights = [
  {
    title: "Find the right hospital faster",
    description: "Search by treatment, location, facilities, doctors, and availability with room for AI-assisted discovery.",
    icon: MapPinned,
  },
  {
    title: "Coordinate equipment and ambulance support",
    description: "Hospitals can surface shortages, collaborate in real time, and manage shared critical resources.",
    icon: ShieldCheck,
  },
  {
    title: "Keep AI helpful, not blocking",
    description: "Semantic search, summaries, and assistant features improve decisions while the core platform stays usable without them.",
    icon: BrainCircuit,
  },
];

const stats = [
  { label: "User roles", value: "3" },
  { label: "Core modules", value: "10+" },
  { label: "Realtime channels", value: "Chat + live updates" },
];

export default function LandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-20 pt-10 sm:px-8 lg:px-12">
      <section className="grid gap-10 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-20">
        <FadeIn className="space-y-8">
          <Pill label="Hackathon MVP" />
          <div className="space-y-5">
            <h1 className="text-balance text-5xl font-semibold tracking-tight text-[var(--foreground)] sm:text-6xl">
              Coordinating hospitals, patients, equipment, and urgent care in one place.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--muted)] sm:text-xl">
              CareBridge AI is a healthcare coordination network for hospital discovery, doctor booking,
              shortage reporting, ambulance help, and inter-hospital collaboration.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/hospital"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:bg-[var(--primary-strong)]"
            >
              Explore hospital workspace
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#platform-overview"
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]"
            >
              View platform structure
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 backdrop-blur"
              >
                <p className="text-2xl font-semibold text-[var(--foreground)]">{item.value}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.label}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.12}>
          <div className="relative overflow-hidden rounded-[32px] border border-[var(--border)] bg-[linear-gradient(160deg,#ffffff_0%,#eef9f7_48%,#fff2dc_100%)] p-7 shadow-[var(--shadow)]">
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(13,148,136,0.18),transparent_65%)]" />
            <div className="relative space-y-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[var(--foreground)]/5 p-3 text-[var(--primary)]">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--muted)]">
                    Platform foundation
                  </p>
                  <p className="text-xl font-semibold text-[var(--foreground)]">Patient + hospital-ready UI shell</p>
                </div>
              </div>

              <div className="space-y-4 rounded-[28px] bg-[var(--card-strong)] p-5">
                {[
                  "Public landing and discovery experience",
                  "Dedicated hospital-side workspace layout",
                  "Shared design tokens and motion primitives",
                  "Scalable folders for services, store, hooks, socket, and types",
                ].map((item, index) => (
                  <div key={item} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white",
                        index % 2 === 0 ? "bg-[var(--primary)]" : "bg-[var(--accent)]",
                      )}
                    >
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-[var(--muted)]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      <section id="platform-overview" className="space-y-8 py-10">
        <SectionHeading
          eyebrow="Platform overview"
          title="A clean frontend base for the modules we’ll build next"
          description="This starter keeps the project hackathon-friendly while leaving space for role-based flows, dashboards, maps, search, and real-time interactions."
        />

        <div className="grid gap-5 md:grid-cols-3">
          {highlights.map((item, index) => {
            const Icon = item.icon;

            return (
              <FadeIn key={item.title} delay={index * 0.08}>
                <article className="h-full rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm backdrop-blur">
                  <div className="mb-5 inline-flex rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </section>
    </div>
  );
}
