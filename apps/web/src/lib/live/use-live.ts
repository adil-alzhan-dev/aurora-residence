"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { createLiveClient, liveSocketUrl, type LiveClient, type LiveListener, type LiveStatus } from "./live-client";

let tabClient: LiveClient | null = null;

/** One connection per tab, created on first use in the browser. */
export function getLiveClient() {
  tabClient ??= createLiveClient({ url: liveSocketUrl(window.location) });
  return tabClient;
}

/** Subscribes for the component's lifetime; the latest handlers are always called. */
export function useLiveEvents(listener: LiveListener) {
  const latest = useRef(listener);
  useEffect(() => {
    latest.current = listener;
  });

  useEffect(
    () =>
      getLiveClient().subscribe({
        onResidence: (residence) => latest.current.onResidence?.(residence),
        onResync: () => latest.current.onResync?.(),
      }),
    [],
  );
}

const serverStatus = (): LiveStatus => "connecting";

export function useLiveStatus() {
  return useSyncExternalStore(
    (notify) => getLiveClient().subscribeStatus(notify),
    () => getLiveClient().getStatus(),
    serverStatus,
  );
}
