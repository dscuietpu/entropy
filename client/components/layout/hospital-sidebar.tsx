import { Activity, Building2, ClipboardPlus, Package, Truck } from "lucide-react";

const navItems = [
  { label: "Overview", icon: Activity },
  { label: "Doctors", icon: ClipboardPlus },
  { label: "Equipment", icon: Package },
  { label: "Ambulances", icon: Truck },
];

export function HospitalSidebar() {
  return (
    <aside className="rounded-[32px] border border-[var(--border)] bg-[rgba(10,32,28,0.95)] p-6 text-white shadow-[var(--shadow)]">
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

          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/86"
            >
              <Icon className="h-4 w-4 text-teal-300" />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
