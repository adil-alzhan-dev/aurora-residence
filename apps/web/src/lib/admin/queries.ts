import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { refreshBatchFor } from "./refresh-batch";
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
  enquiryList: (path: string) => ["admin", "enquiries", "list", path] as const,
  enquiryCard: (id: number) => ["admin", "enquiries", "card", id] as const,
  residenceEnquiries: (number: string) => ["admin", "enquiries", { residence: number }] as const,
};

export const residencePath = (number: string) => `/api/admin/residences/${encodeURIComponent(number)}`;

export function useMe() {
  return useQuery({
    queryKey: adminKeys.me,
    queryFn: ({ signal }) => adminApi.getJson("/api/auth/me", meSchema, signal),
    staleTime: 5 * 60_000,
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: ({ signal }) => adminApi.getJson("/api/admin/dashboard", dashboardSchema, signal),
  });
}

export function useAdminResidences(params: ListParams) {
  return useQuery({
    queryKey: adminKeys.residenceList(params),
    queryFn: ({ signal }) => adminApi.getJson(residencesApiPath(params), residenceListSchema, signal),
    placeholderData: (previous) => previous,
  });
}

export function useResidenceCard(number: string) {
  return useQuery({
    queryKey: adminKeys.residenceCard(number),
    queryFn: ({ signal }) => adminApi.getJson(residencePath(number), residenceCardSchema, signal),
  });
}

export function useResidenceEnquiries(number: string) {
  return useQuery({
    queryKey: adminKeys.residenceEnquiries(number),
    queryFn: ({ signal }) =>
      adminApi.getJson(`/api/admin/enquiries?residence=${encodeURIComponent(number)}&limit=20`, enquiryListSchema, signal),
  });
}

/**
 * After any change the cards, the lists and the dashboard ask the API again. The live event about
 * the same change usually arrives within the batch window, so both lead to a single read.
 */
export function useInvalidateAdminData() {
  const queryClient = useQueryClient();
  return () => refreshBatchFor(queryClient).everything();
}

export type ResidenceChange = { priceUsd?: number; status?: AdminResidenceStatus; note?: string };

export function useUpdateResidence(number: string) {
  const invalidate = useInvalidateAdminData();
  return useMutation({
    mutationFn: (change: ResidenceChange) =>
      adminApi.sendJson(residencePath(number), "PATCH", change, residenceCardSchema),
    onSettled: invalidate,
  });
}

export function useReleaseReservation(number: string) {
  const invalidate = useInvalidateAdminData();
  return useMutation({
    mutationFn: (note?: string) =>
      adminApi.sendJson(`${residencePath(number)}/release`, "POST", note ? { note } : {}, reservationStateSchema),
    onSettled: invalidate,
  });
}
