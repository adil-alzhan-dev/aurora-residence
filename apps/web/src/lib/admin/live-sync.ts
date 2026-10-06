"use client";

import { useQueryClient, type QueryClient } from "@tanstack/react-query";

import { useLiveEvents } from "@/lib/live/use-live";

import { adminKeys } from "./queries";

/**
 * A residence changed somewhere: its card, every residence list and the dashboard read again.
 * Enquiry screens show the reservation state and the enquiry status a reservation moves, so they follow.
 */
export function invalidateResidence(queryClient: QueryClient, number: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: adminKeys.residenceCard(number) }),
    queryClient.invalidateQueries({ queryKey: [...adminKeys.residences, "list"] }),
    queryClient.invalidateQueries({ queryKey: adminKeys.dashboard }),
    queryClient.invalidateQueries({ queryKey: adminKeys.enquiries }),
  ]);
}

/** After a reconnect any residence may have changed while the socket was down. */
export function invalidateAllResidences(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: adminKeys.residences }),
    queryClient.invalidateQueries({ queryKey: adminKeys.dashboard }),
    queryClient.invalidateQueries({ queryKey: adminKeys.enquiries }),
  ]);
}

export function useAdminLiveSync() {
  const queryClient = useQueryClient();
  useLiveEvents({
    onResidence: (residence) => void invalidateResidence(queryClient, residence.number),
    onResync: () => void invalidateAllResidences(queryClient),
  });
}
