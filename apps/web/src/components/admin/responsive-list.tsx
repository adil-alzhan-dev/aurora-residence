"use client";

import { useSyncExternalStore, type ReactNode } from "react";

// The same breakpoint as Tailwind's max-md: and md: variants.
const PHONE_QUERY = "(width < 48rem)";

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const isPhone = () => window.matchMedia(PHONE_QUERY).matches;

// Server and hydration render the desktop table, so a desktop page never changes after load.
const onServer = () => false;

type ResponsiveListProps = {
  phone: ReactNode;
  desktop: ReactNode;
};

/**
 * Lists of the admin: cards below 768 px, the table from 768. Only the variant on screen is
 * mounted (a phone does not build 66 hidden status selects); the CSS classes still hide the
 * other one for the moment between a resize and the re-render.
 */
export function ResponsiveList({ phone, desktop }: ResponsiveListProps) {
  return useSyncExternalStore(subscribe, isPhone, onServer) ? (
    <div className="md:hidden">{phone}</div>
  ) : (
    <div className="max-md:hidden">{desktop}</div>
  );
}
