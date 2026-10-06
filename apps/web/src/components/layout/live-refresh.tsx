"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useLiveEvents } from "@/lib/live/use-live";

/** Several updates in a burst (a reservation and its enquiry) become one refresh. */
export const LIVE_REFRESH_DELAY_MS = 150;

/**
 * The site pages render on the server, so a change is applied by rendering them again:
 * router.refresh() keeps client state (selected floor, filters, scroll, an open form) and only
 * swaps the server data. After a reconnect the same refresh picks up anything missed offline.
 */
export function LiveRefresh() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const scheduleRefresh = () => {
    if (timer.current !== undefined) return;
    timer.current = setTimeout(() => {
      timer.current = undefined;
      router.refresh();
    }, LIVE_REFRESH_DELAY_MS);
  };

  useLiveEvents({ onResidence: scheduleRefresh, onResync: scheduleRefresh });
  return null;
}
