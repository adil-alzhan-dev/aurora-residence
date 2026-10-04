"use client";

import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

import { filtersToSearch, type ResidenceFilters } from "@/lib/residence-filters";
import { sortParam, type ResidenceSort } from "@/lib/residence-sort";

/** The sort order lives in the address next to the filters, like the filters themselves. */
export function useSortNavigation(sort: ResidenceSort, filters: ResidenceFilters, view: string) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(sort);

  const apply = (next: ResidenceSort) => {
    startTransition(() => {
      setCurrent(next);
      router.replace(`${pathname}${filtersToSearch(filters, { view, sort: sortParam(next) })}`, { scroll: false });
    });
  };

  return { sort: current, pending, apply };
}
