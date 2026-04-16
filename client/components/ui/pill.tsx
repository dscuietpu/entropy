interface PillProps {
  label: string;
}

export function Pill({ label }: PillProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
      {label}
    </div>
  );
}
