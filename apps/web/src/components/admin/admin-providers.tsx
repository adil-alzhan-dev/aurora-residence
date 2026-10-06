"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { SessionExpiredError } from "@/lib/admin/api-client";

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

export function AdminProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
