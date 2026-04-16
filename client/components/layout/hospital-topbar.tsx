export function HospitalTopbar() {
  return (
    <div className="flex flex-col gap-4 rounded-[26px] border border-[var(--border)] bg-white/80 px-5 py-5 shadow-[0_14px_34px_rgba(16,35,27,0.04)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Workspace shell</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">Hospital operations</h1>
      </div>

      <div className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--muted)]">
        Role-based navigation ready
      </div>
    </div>
  );
}
