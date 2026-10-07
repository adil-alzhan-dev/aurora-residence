"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useLiveEvents } from "@/lib/live/use-live";

import { refreshBatchFor } from "./refresh-batch";

/**
 * A residence changed somewhere: its card, every residence list and the dashboard read again.
 * Enquiry screens show the reservation state and the enquiry status a reservation moves, so they
 * follow. After a reconnect anything may have changed while the socket was down.
 */
export function useAdminLiveSync() {
  const batch = refreshBatchFor(useQueryClient());
  useEffect(() => () => batch.cancel(), [batch]);
  useLiveEvents({
    onResidence: (residence) => batch.residence(residence.number),
    onResync: () => void batch.everything(),
  });
}
