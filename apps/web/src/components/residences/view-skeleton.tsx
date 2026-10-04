"use client";

import { useSearchParams } from "next/navigation";

import { PageSkeleton } from "./page-skeleton";

/** The facade is dark, the floor grid and the list are light: the skeleton follows ?view=. */
export function ViewSkeleton({ label }: { label: string }) {
  const view = useSearchParams().get("view");
  return <PageSkeleton theme={view === "grid" || view === "list" ? "light" : "dark"} label={label} />;
}
