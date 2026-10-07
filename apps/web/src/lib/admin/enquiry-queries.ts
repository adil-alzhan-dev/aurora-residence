import { useMutation, useQueries, useQuery } from "@tanstack/react-query";

import { ENQUIRY_STATUSES, enquiriesApiPath, enquiryCountPath, type EnquiryFilters } from "./enquiry-filters";
import { adminKeys, residencePath, useInvalidateAdminData } from "./queries";
import {
  enquiryCardSchema,
  enquiryListSchema,
  reservationStateSchema,
  type AdminEnquiryStatus,
} from "./schemas";
import { adminApi } from "./session";

const enquiryPath = (id: number) => `/api/admin/enquiries/${id}`;

export function useAdminEnquiries(filters: EnquiryFilters) {
  const path = enquiriesApiPath(filters);
  return useQuery({
    queryKey: adminKeys.enquiryList(path),
    queryFn: ({ signal }) => adminApi.getJson(path, enquiryListSchema, signal),
    placeholderData: (previous) => previous,
  });
}

export type EnquiryCounts = Record<AdminEnquiryStatus | "ALL", number>;

/** Totals for the status tabs under the same search and residence, so they never drop to zero. */
export function useEnquiryCounts({ search, residence }: Pick<EnquiryFilters, "search" | "residence">) {
  const statuses = [null, ...ENQUIRY_STATUSES];
  return useQueries({
    queries: statuses.map((status) => {
      const path = enquiryCountPath({ search, residence, status });
      return {
        queryKey: adminKeys.enquiryList(path),
        queryFn: ({ signal }) => adminApi.getJson(path, enquiryListSchema, signal),
        placeholderData: <T>(previous: T) => previous,
      };
    }),
    combine: (results): EnquiryCounts | undefined => {
      if (results.some((result) => !result.data)) return undefined;
      const [all, ...rest] = results.map((result) => result.data?.total ?? 0);
      return { ALL: all, NEW: rest[0], IN_PROGRESS: rest[1], CLOSED: rest[2] };
    },
  });
}

export function useEnquiryCard(id: number) {
  return useQuery({
    queryKey: adminKeys.enquiryCard(id),
    queryFn: ({ signal }) => adminApi.getJson(enquiryPath(id), enquiryCardSchema, signal),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export type EnquiryChange = {
  status?: AdminEnquiryStatus;
  managerNote?: string;
  residenceNumber?: string;
};

export function useUpdateEnquiry(id: number) {
  const invalidate = useInvalidateAdminData();
  return useMutation({
    mutationFn: (change: EnquiryChange) => adminApi.sendJson(enquiryPath(id), "PATCH", change, enquiryCardSchema),
    onSettled: invalidate,
  });
}

export function useReserveResidence() {
  const invalidate = useInvalidateAdminData();
  return useMutation({
    mutationFn: ({ number, enquiryId }: { number: string; enquiryId: number }) =>
      adminApi.sendJson(`${residencePath(number)}/reserve`, "POST", { enquiryId }, reservationStateSchema),
    onSettled: invalidate,
  });
}
