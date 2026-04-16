"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/hooks";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<"patient" | "hospital_admin" | "doctor">;
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isHydrated, token, user, isAuthenticated, syncCurrentUser } = useAuth();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!user) {
      void syncCurrentUser();
    }
  }, [isHydrated, pathname, router, syncCurrentUser, token, user]);

  useEffect(() => {
    if (!isHydrated || !user || !allowedRoles?.length) {
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [allowedRoles, isHydrated, router, user]);

  if (!isHydrated) {
    return <div className="p-6 text-sm text-[var(--muted)]">Loading session...</div>;
  }

  if (!isAuthenticated || !token || !user) {
    return <div className="p-6 text-sm text-[var(--muted)]">Checking access...</div>;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <div className   ="p-6 text-sm text-[var(--muted)]">Redirecting...</div>;
  }

  return <>{children}</>;
}
