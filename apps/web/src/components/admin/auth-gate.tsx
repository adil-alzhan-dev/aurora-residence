"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { loginHref } from "@/lib/admin/paths";
import { adminApi } from "@/lib/admin/session";

/**
 * The refresh cookie is scoped to /api/auth, so only the browser can tell whether there is
 * a session: on first open it asks for a new access token and shows nothing of the admin
 * until the answer comes. Without a session it goes to sign-in and remembers the page.
 */
export function AuthGate({ children, checkingLabel }: { children: ReactNode; checkingLabel: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(adminApi.hasAccessToken);

  useEffect(() => {
    if (ready) return;
    let active = true;
    adminApi.refresh().then((token) => {
      if (!active) return;
      if (token) {
        setReady(true);
        return;
      }
      const { pathname, search, hash } = window.location;
      router.replace(loginHref(`${pathname}${search}${hash}`));
    });
    return () => {
      active = false;
    };
  }, [ready, router]);

  if (!ready) {
    return (
      <div role="status" aria-live="polite" className="flex min-h-svh items-center justify-center bg-background">
        <span className="text-admin-caption text-muted-foreground">{checkingLabel}</span>
      </div>
    );
  }
  return children;
}
