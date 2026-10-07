"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { SessionExpiredError } from "@/lib/admin/api-client";

import { AdminLocaleProvider } from "./admin-locale";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        // The client already refreshed once; an expired session goes to the sign-in page.
        retry: (failureCount, error) => !(error instanceof SessionExpiredError) && failureCount < 1,
      },
    },
  });
}

/** A language switch re-renders the admin from the server; the query cache and the session stay. */
export function AdminProviders({ intl, children }: { intl: string; children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AdminLocaleProvider intl={intl}>{children}</AdminLocaleProvider>
    </QueryClientProvider>
  );
}
