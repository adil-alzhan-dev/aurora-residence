import { useQuery } from "@tanstack/react-query";

import { residencesApiPath, type ResidenceFilters } from "./residence-filters";
import { dashboardSchema, meSchema, residenceListSchema } from "./schemas";
import { adminApi } from "./session";

type ListParams = Pick<ResidenceFilters, "search" | "floor">;

export const adminKeys = {
  me: ["admin", "me"] as const,
  dashboard: ["admin", "dashboard"] as const,
  residences: ["admin", "residences"] as const,
  residenceList: (params: ListParams) => ["admin", "residences", "list", params] as const,
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

export function useAdminResidences(params: ListParams) {
  return useQuery({
    queryKey: adminKeys.residenceList(params),
    queryFn: () => adminApi.getJson(residencesApiPath(params), residenceListSchema),
    placeholderData: (previous) => previous,
  });
}
