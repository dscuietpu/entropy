interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--primary)]">{eyebrow}</p>
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
        {title}
      </h2>
      <p className="text-base leading-8 text-[var(--muted)]">{description}</p>
    </div>
  );
}
