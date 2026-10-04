"use client";

import type { Dictionary } from "@/content";
import type { FilterResult, KeptParams, ResidenceFilters } from "@/lib/residence-filters";

import type { PriceRange } from "../filters/filter-fields";
import { FiltersSheet } from "../filters/filters-sheet";
import { FilterChips } from "./filter-chips";

type MobileFilterRowProps = {
  filters: ResidenceFilters;
  result: FilterResult | null;
  priceRange: PriceRange | null;
  keep: KeptParams;
  t: Pick<Dictionary, "list" | "filters">;
};

/** "Filters" opens the sheet, each active filter is a chip that removes it. */
export function MobileFilterRow({ filters, result, priceRange, keep, t }: MobileFilterRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FiltersSheet filters={filters} result={result} priceRange={priceRange} keep={keep} t={t.filters} theme="light" />
      <FilterChips filters={filters} keep={keep} t={t.list} />
    </div>
  );
}
