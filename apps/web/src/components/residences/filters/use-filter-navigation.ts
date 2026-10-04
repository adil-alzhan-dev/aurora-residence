"use client";

import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

import { emptyFilters, filtersToSearch, type ResidenceFilters } from "@/lib/residence-filters";

/**
 * Filters live in the address, so a link can be shared. The page reloads its data on the server;
 * the controls switch at once and `pending` marks the numbers that are still on their way.
 */
export function useFilterNavigation(filters: ResidenceFilters, view: string | null) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(filters);

  const apply = (next: ResidenceFilters) => {
    startTransition(() => {
      setCurrent(next);
      router.replace(`${pathname}${filtersToSearch(next, view)}`, { scroll: false });
    });
  };

  return {
    filters: current,
    pending,
    update: (patch: Partial<ResidenceFilters>) => apply({ ...current, ...patch }),
    reset: () => apply(emptyFilters),
  };
}
