"use client";

import dynamic from "next/dynamic";

/**
 * LiveRefresh renders nothing, so it is loaded after hydration: the socket client and its
 * message schema stay out of the script that the first screen waits for.
 */
export const DeferredLiveRefresh = dynamic(() => import("./live-refresh").then((module) => module.LiveRefresh), {
  ssr: false,
});
