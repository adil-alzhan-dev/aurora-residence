import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { residencesApiPath, type ResidenceFilters } from "./residence-filters";
import {
  dashboardSchema,
  enquiryListSchema,
  meSchema,
  reservationStateSchema,
  residenceCardSchema,
  residenceListSchema,
  type AdminResidenceStatus,
} from "./schemas";
import { adminApi } from "./session";

type ListParams = Pick<ResidenceFilters, "search" | "floor">;

export const adminKeys = {
  me: ["admin", "me"] as const,
  dashboard: ["admin", "dashboard"] as const,
  residences: ["admin", "residences"] as const,
  residenceList: (params: ListParams) => ["admin", "residences", "list", params] as const,
  residenceCard: (number: string) => ["admin", "residences", "card", number] as const,
  enquiries: ["admin", "enquiries"] as const,
  residenceEnquiries: (number: string) => ["admin", "enquiries", { residence: number }] as const,
};

const residencePath = (number: string) => `/api/admin/residences/${encodeURIComponent(number)}`;

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

export function useResidenceCard(number: string) {
  return useQuery({
    queryKey: adminKeys.residenceCard(number),
    queryFn: () => adminApi.getJson(residencePath(number), residenceCardSchema),
  });
}

export function useResidenceEnquiries(number: string) {
  return useQuery({
    queryKey: adminKeys.residenceEnquiries(number),
    queryFn: () =>
      adminApi.getJson(`/api/admin/enquiries?residence=${encodeURIComponent(number)}&limit=20`, enquiryListSchema),
  });
}

/** After any change the card, the list and the dashboard ask the API again. */
function useInvalidateResidences() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: adminKeys.residences }),
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: adminKeys.enquiries }),
    ]);
}

export type ResidenceChange = { priceUsd?: number; status?: AdminResidenceStatus; note?: string };

export function useUpdateResidence(number: string) {
  const invalidate = useInvalidateResidences();
  return useMutation({
    mutationFn: (change: ResidenceChange) =>
      adminApi.sendJson(residencePath(number), "PATCH", change, residenceCardSchema),
    onSettled: invalidate,
  });
}

export function useReleaseReservation(number: string) {
  const invalidate = useInvalidateResidences();
  return useMutation({
    mutationFn: (note?: string) =>
      adminApi.sendJson(`${residencePath(number)}/release`, "POST", note ? { note } : {}, reservationStateSchema),
    onSettled: invalidate,
  });
}
