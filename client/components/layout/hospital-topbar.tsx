export function HospitalTopbar() {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--muted)]">Workspace shell</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">Hospital operations</h1>
      </div>

      <div className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--muted)]">
        Role-based navigation ready
      </div>
    </div>
  );
}
