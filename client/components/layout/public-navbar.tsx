import { HeartPulse, Stethoscope } from "lucide-react";

const links = [
  { href: "#platform-overview", label: "Platform" },
  { href: "/hospital", label: "Hospital" },
];

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-12">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--foreground)] text-white shadow-lg">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-[var(--foreground)]">CareBridge AI</p>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Hospital coordination</p>
          </div>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]">
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="/hospital"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--foreground)] backdrop-blur transition hover:border-[var(--primary)]"
        >
          <Stethoscope className="h-4 w-4 text-[var(--primary)]" />
          Hospital login
        </a>
      </div>
    </header>
  );
}
