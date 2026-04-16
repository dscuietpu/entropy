"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  PackageCheck,
  PackageSearch,
  ShieldAlert,
  Stethoscope,
  Truck,
} from "lucide-react";

import { getErrorMessage } from "@/lib/utils";
import { createAsyncState, type AsyncState } from "@/types";
import { getHospitalDashboardMetrics, type HospitalDashboardMetrics } from "@/services";
import { useAuth } from "@/hooks/use-auth";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ErrorState } from "@/components/ui/error-state";

const summaryConfig = [
  {
    key: "totalDoctors",
    title: "Total doctors",
    detail: "Active specialists linked to this hospital network profile.",
    accent: "bg-teal-50 text-teal-700",
    icon: Stethoscope,
  },
  {
    key: "totalEquipment",
    title: "Total equipment",
    detail: "All tracked devices and operational assets across departments.",
    accent: "bg-emerald-50 text-emerald-700",
    icon: PackageSearch,
  },
  {
    key: "availableEquipment",
    title: "Available equipment",
    detail: "Units currently ready for allocation without maintenance blockers.",
    accent: "bg-lime-50 text-lime-700",
    icon: PackageCheck,
  },
  {
    key: "totalAmbulances",
    title: "Total ambulances",
    detail: "Vehicles in your response fleet including active and standby units.",
    accent: "bg-sky-50 text-sky-700",
    icon: Truck,
  },
  {
    key: "pendingAppointments",
    title: "Pending appointments",
    detail: "Requests that still need confirmation or scheduling action.",
    accent: "bg-amber-50 text-amber-700",
    icon: CalendarClock,
  },
  {
    key: "openIssues",
    title: "Open issues",
    detail: "Public and operational issues still waiting for team resolution.",
    accent: "bg-rose-50 text-rose-700",
    icon: ShieldAlert,
  },
] as const;

export function DashboardShell() {
  const { token, user } = useAuth();
  const [state, setState] = useState<AsyncState<HospitalDashboardMetrics>>(createAsyncState());

  useEffect(() => {
    if (!token || !user?.linkedHospitalId) {
      setState({
        data: null,
        isLoading: false,
        error: "Hospital dashboard is available after linking a hospital admin account to a hospital profile.",
      });
      return;
    }

    let isMounted = true;

    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }));

    getHospitalDashboardMetrics(user.linkedHospitalId, token)
      .then((data) => {
        if (!isMounted) return;
        setState({
          data,
          isLoading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setState({
          data: null,
          isLoading: false,
          error: getErrorMessage(error),
        });
      });

    return () => {
      isMounted = false;
    };
  }, [token, user?.linkedHospitalId]);

  if (state.error && !state.data) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description={state.error}
      />
    );
  }

  const metrics = state.data;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[34px] border border-[var(--border)] bg-[linear-gradient(135deg,#0f766e_0%,#134e4a_55%,#10231b_100%)] px-6 py-8 text-white shadow-[0_25px_70px_rgba(15,118,110,0.24)] sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100/90">Hospital dashboard</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {metrics?.hospital.name ?? "Operations overview"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-teal-50/88">
              Track doctors, resources, appointments, and issue pressure from one admin surface built for quick demo flow and easy expansion.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.22em] text-teal-100/80">Location</p>
            <p className="mt-2 text-lg font-semibold">
              {metrics ? `${metrics.hospital.city}, ${metrics.hospital.state}` : "Loading profile"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryConfig.map((item) => (
          <SummaryCard
            key={item.key}
            title={item.title}
            value={state.isLoading ? "..." : (metrics?.summary[item.key] ?? 0)}
            detail={item.detail}
            accent={item.accent}
            icon={item.icon}
          />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <SectionPanel
          eyebrow="Charts"
          title="Readiness and demand trends"
          description="These cards reserve space for live charts later. For now, they present the shape of the dashboard and a simple visual summary for hackathon demos."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--border)] bg-[rgba(15,118,110,0.04)] p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">Appointment load</p>
              <div className="mt-5 flex h-40 items-end gap-3">
                {[38, 52, 48, 70, 66, 84, 76].map((value, index) => (
                  <div key={index} className="flex-1 rounded-t-2xl bg-[linear-gradient(180deg,#14b8a6_0%,#0f766e_100%)]" style={{ height: `${value}%` }} />
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-[rgba(217,119,6,0.06)] p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">Equipment readiness</p>
              <div className="mt-5 space-y-3">
                {[
                  ["Available", metrics?.summary.availableEquipment ?? 0, "bg-emerald-500"],
                  ["Reserved", Math.max((metrics?.summary.totalEquipment ?? 0) - (metrics?.summary.availableEquipment ?? 0), 0), "bg-amber-500"],
                  ["Open issues", metrics?.summary.openIssues ?? 0, "bg-rose-500"],
                ].map(([label, value, color]) => (
                  <div key={label as string}>
                    <div className="mb-2 flex items-center justify-between text-sm text-[var(--muted)]">
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                    <div className="h-3 rounded-full bg-black/6">
                      <div
                        className={`h-3 rounded-full ${color as string}`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              12,
                              ((value as number) / Math.max(metrics?.summary.totalEquipment ?? 1, 1)) * 100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionPanel>

        <SectionPanel
          eyebrow="Trends"
          title="What the team should watch next"
          description="These trend notes keep the dashboard useful even before advanced analytics and AI insights are fully integrated."
        >
          <div className="space-y-3">
            {[
              {
                title: "Appointment response queue",
                text: "Pending appointments are surfaced as the fastest operational follow-up for admin teams.",
              },
              {
                title: "Resource pressure",
                text: "Available equipment is separated from total stock so shortage signals are immediately visible.",
              },
              {
                title: "Issue resolution lane",
                text: "Open issues stay visible beside charts to keep public-facing problems part of the daily workflow.",
              },
            ].map((item) => (
              <article key={item.title} className="rounded-[22px] border border-[var(--border)] bg-[rgba(16,35,27,0.03)] p-4">
                <h3 className="text-base font-semibold text-[var(--foreground)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.text}</p>
              </article>
            ))}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
