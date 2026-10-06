import { useQuery } from "@tanstack/react-query";

import { dashboardSchema, meSchema } from "./schemas";
import { adminApi } from "./session";

export const adminKeys = {
  me: ["admin", "me"] as const,
  dashboard: ["admin", "dashboard"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: adminKeys.me,
    queryFn: () => adminApi.getJson("/api/auth/me", meSchema),
    staleTime: 5 * 60_000,
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: () => adminApi.getJson("/api/admin/dashboard", dashboardSchema),
  });
}
