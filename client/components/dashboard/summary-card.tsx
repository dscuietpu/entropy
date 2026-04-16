import type { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: number | string;
  detail: string;
  accent: string;
  icon: LucideIcon;
}

export function SummaryCard({ title, value, detail, accent, icon: Icon }: SummaryCardProps) {
  return (
    <article className="surface-card rounded-[30px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--muted)]">{title}</p>
          <p className="mt-5 text-4xl font-semibold tracking-tight text-[var(--foreground)]">{value}</p>
        </div>
        <div className={`rounded-[20px] ${accent} p-3.5 shadow-sm`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 max-w-[18rem] text-sm leading-7 text-[var(--muted)]">{detail}</p>
    </article>
  );
}
