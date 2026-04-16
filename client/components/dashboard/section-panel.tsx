interface SectionPanelProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SectionPanel({ eyebrow, title, description, children }: SectionPanelProps) {
  return (
    <section className="surface-panel rounded-[32px] p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--primary)]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">{description}</p>
      <div className="mt-7">{children}</div>
    </section>
  );
}
