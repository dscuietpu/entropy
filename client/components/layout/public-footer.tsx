export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-white/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-[var(--muted)] sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <p>CareBridge AI frontend foundation for the hackathon MVP.</p>
        <p>Next.js App Router, TypeScript, Tailwind CSS, and Framer Motion.</p>
      </div>
    </footer>
  );
}
