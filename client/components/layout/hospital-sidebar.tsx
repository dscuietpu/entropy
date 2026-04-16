"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Building2, CalendarClock, ClipboardPlus, MessageSquareMore, Package, ShieldAlert, Share2, Truck } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/hospital/dashboard", icon: Activity },
  { label: "Doctors", href: "/hospital", icon: ClipboardPlus },
  { label: "Equipment", href: "/hospital/equipment", icon: Package },
  { label: "Ambulances", href: "/hospital/ambulances", icon: Truck },
  { label: "Appointments", href: "/hospital/appointments", icon: CalendarClock },
  { label: "Issues", href: "/hospital/issues", icon: ShieldAlert },
  { label: "Network", href: "/hospital/network", icon: Share2 },
  { label: "Chat", href: "/hospital/chat", icon: MessageSquareMore },
] as const;

export function HospitalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,32,28,0.98),rgba(10,32,28,0.94))] p-6 text-white shadow-[var(--shadow)]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-semibold">Hospital Portal</p>
          <p className="text-sm text-white/70">Operations workspace</p>
        </div>
      </div>

      <div className="mt-10 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium transition ${
                isActive
                  ? "border-teal-300/40 bg-teal-400/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "border-white/10 bg-white/5 text-white/86 hover:border-white/20 hover:bg-white/8"
              }`}
            >
              <Icon className="h-4 w-4 text-teal-300" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
