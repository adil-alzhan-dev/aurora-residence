import { useQueries, useQuery } from "@tanstack/react-query";

import {
  dashboardSchema,
  enquiryListSchema,
  meSchema,
  residenceCardSchema,
  residenceListSchema,
} from "./schemas";
import { adminApi } from "./session";

export const LATEST_ENQUIRIES = 5;

export const adminKeys = {
  me: ["admin", "me"] as const,
  dashboard: ["admin", "dashboard"] as const,
  residences: ["admin", "residences"] as const,
  residence: (number: string) => ["admin", "residences", number] as const,
  latestEnquiries: ["admin", "enquiries", { limit: LATEST_ENQUIRIES }] as const,
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

export function useAdminResidences() {
  return useQuery({
    queryKey: adminKeys.residences,
    queryFn: () => adminApi.getJson("/api/admin/residences", residenceListSchema),
  });
}

export function useLatestEnquiries() {
  return useQuery({
    queryKey: adminKeys.latestEnquiries,
    queryFn: () => adminApi.getJson(`/api/admin/enquiries?limit=${LATEST_ENQUIRIES}`, enquiryListSchema),
  });
}

/** The client of a reservation is only on the residence card, so each reserved residence is asked for. */
export function useReservationCards(numbers: string[]) {
  return useQueries({
    queries: numbers.map((number) => ({
      queryKey: adminKeys.residence(number),
      queryFn: () => adminApi.getJson(`/api/admin/residences/${encodeURIComponent(number)}`, residenceCardSchema),
    })),
  });
}
