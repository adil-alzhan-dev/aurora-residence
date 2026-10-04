"use client";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import { fillTemplate } from "@/lib/format";
import { activeFilterCount, type FilterResult, type ResidenceFilters } from "@/lib/residence-filters";
import { cn } from "@/lib/utils";

import { FilterFields, type PriceRange } from "./filter-fields";
import { useFilterNavigation } from "./use-filter-navigation";

export type FiltersProps = {
  filters: ResidenceFilters;
  result: FilterResult | null;
  priceRange: PriceRange | null;
  /** Kept in the address next to the filters, for example "grid" or "list". */
  view: string | null;
  t: Dictionary["filters"];
};

export function describeResult(result: FilterResult, filters: ResidenceFilters, t: Dictionary["filters"]) {
  const template = activeFilterCount(filters) > 0 ? t.resultFiltered : t.resultAll;
  return fillTemplate(template, { ...result });
}

/** Desktop row from Figma: bedrooms as segments, price and floor selects, the count and Reset. */
export function FiltersBar({ filters, result, priceRange, view, t }: FiltersProps) {
  const navigation = useFilterNavigation(filters, view);

  return (
    <section aria-label={t.label} className="hidden border-y border-border lg:block">
      <div className="container-page flex items-end gap-12 py-6">
        <FilterFields
          filters={navigation.filters}
          priceRange={priceRange}
          onChange={navigation.update}
          t={t}
          idPrefix="filters-bar"
          className="flex-row items-end gap-12"
        />
        <div className="ml-12 flex items-center gap-6">
          {result && (
            <p
              aria-live="polite"
              className={cn("text-body whitespace-nowrap text-foreground transition-opacity", navigation.pending && "opacity-50")}
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
