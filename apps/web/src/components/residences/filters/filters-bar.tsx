"use client";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import { fillTemplate } from "@/lib/format";
import { activeFilterCount, type FilterResult, type KeptParams, type ResidenceFilters } from "@/lib/residence-filters";
import { cn } from "@/lib/utils";

import { FilterFields, type PriceRange } from "./filter-fields";
import { useFilterNavigation } from "./use-filter-navigation";

export type FiltersProps = {
  filters: ResidenceFilters;
  result: FilterResult | null;
  priceRange: PriceRange | null;
  /** Kept in the address next to the filters: the view and the sort order. */
  keep: KeptParams;
  t: Dictionary["filters"];
};

export function describeResult(result: FilterResult, filters: ResidenceFilters, t: Dictionary["filters"]) {
  const template = activeFilterCount(filters) > 0 ? t.resultFiltered : t.resultAll;
  return fillTemplate(template, { ...result });
}

/** Desktop row from Figma: bedrooms as segments, price and floor selects, the count and Reset. */
export function FiltersBar({ filters, result, priceRange, keep, t }: FiltersProps) {
  const navigation = useFilterNavigation(filters, keep);

  return (
    <section aria-label={t.label} className="hidden border-y border-border lg:block">
      <div className="container-page flex flex-wrap items-end gap-x-8 gap-y-6 py-6 xl:gap-x-12 wide:flex-nowrap">
        <FilterFields
          filters={navigation.filters}
          priceRange={priceRange}
          onChange={navigation.update}
          t={t}
          idPrefix="filters-bar"
          className="flex-row items-end gap-8 xl:gap-12"
        />
        <div className="flex items-center gap-6 xl:ml-12">
          {result && (
            <p
              aria-live="polite"
              className={cn(
                "text-body whitespace-nowrap text-foreground transition-opacity",
                navigation.pending && "opacity-50",
              )}
            >
              {describeResult(result, filters, t)}
            </p>
          )}
          <Button variant="ghost" onClick={navigation.reset}>
            {t.reset}
          </Button>
        </div>
      </div>
    </section>
  );
}
