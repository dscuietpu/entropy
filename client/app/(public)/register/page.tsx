"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { useAsyncTask, useAuth, useToast } from "@/hooks";
import { getErrorMessage } from "@/lib/utils";
import { authService } from "@/services";
import { useAuthStore } from "@/store";
import type { AuthResponse, UserRole } from "@/types";

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: "Patient", value: "patient" },
  { label: "Hospital Admin", value: "hospital_admin" },
  { label: "Doctor", value: "doctor" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuth();
  const { setSession } = useAuthStore();
  const toast = useToast();
  const { isLoading, error, run } = useAsyncTask<AuthResponse>();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "patient" as UserRole,
    linkedHospitalId: "",
  });

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/hospital");
    }
  }, [isAuthenticated, isHydrated, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      ...form,
      linkedHospitalId: form.linkedHospitalId.trim() || undefined,
    };

    try {
      const result = await run(() => authService.register(payload));
      setSession(result);
      toast.success("Account created", "Your new account is ready to use.");
      router.push(form.role === "patient" ? "/" : "/hospital");
    } catch (submitError) {
      toast.error("Registration failed", getErrorMessage(submitError, "Please review the form and try again."));
    }
  };

  return (
    <AuthShell
      title="Create your account"
      description="Register as a patient or hospital-side user so the MVP can support both public access and operations workflows."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--primary)]">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            required
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
            placeholder="+91..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            minLength={6}
            required
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="role">
            Role
          </label>
          <select
            id="role"
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({ ...current, role: event.target.value as UserRole }))
            }
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
          >
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {form.role !== "patient" ? (
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="linkedHospitalId">
              Linked hospital ID
            </label>
            <input
              id="linkedHospitalId"
              value={form.linkedHospitalId}
              onChange={(event) =>
                setForm((current) => ({ ...current, linkedHospitalId: event.target.value }))
              }
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
              placeholder="Optional for patient, useful for hospital-side users"
            />
          </div>
        ) : null}

        {error ? <p className="sm:col-span-2 text-sm text-red-600">{error}</p> : null}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
