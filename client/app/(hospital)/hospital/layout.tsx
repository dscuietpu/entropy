import { HospitalSidebar } from "@/components/layout/hospital-sidebar";
import { HospitalTopbar } from "@/components/layout/hospital-topbar";

export default function HospitalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[rgba(250,252,248,0.7)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[280px_1fr] lg:px-6">
        <HospitalSidebar />
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow)] backdrop-blur sm:p-6">
          <HospitalTopbar />
          <main className="mt-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
