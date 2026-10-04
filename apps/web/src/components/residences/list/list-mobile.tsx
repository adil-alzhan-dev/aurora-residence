"use client";

import { SelectField } from "@/components/ui/select-field";
import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate } from "@/lib/format";
import type { FilterResult, KeptParams, ResidenceFilters } from "@/lib/residence-filters";
import { parseResidenceSort, sortOptions, type ResidenceSort } from "@/lib/residence-sort";
import { cn } from "@/lib/utils";

import type { PriceRange } from "../filters/filter-fields";
import { FiltersSheet } from "../filters/filters-sheet";
import { FilterChips } from "./filter-chips";
import { residenceNoun } from "./list-text";
import { ResidenceCard } from "./residence-card";
import { ShowMore } from "./show-more";
import { useShowMore } from "./use-show-more";
import { useSortNavigation } from "./use-sort-navigation";

const PAGE_SIZE = 6;

type ListMobileProps = {
  residences: Residence[];
  result: FilterResult;
  filters: ResidenceFilters;
  priceRange: PriceRange | null;
  sort: ResidenceSort;
  view: string;
  keep: KeptParams;
  t: Pick<Dictionary, "list" | "floorPage" | "status" | "filters">;
};

/** M / Residences / List: filters, chips and sort on top, then cards six at a time. No hover states. */
export function ListMobile({ residences, result, filters, priceRange, sort, view, keep, t }: ListMobileProps) {
  const navigation = useSortNavigation(sort, filters, view);
  const pages = useShowMore(residences.length, PAGE_SIZE);

  return (
    <div className="container-page flex flex-col gap-6 pb-12">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <FiltersSheet filters={filters} result={result} priceRange={priceRange} keep={keep} t={t.filters} theme="light" />
          <FilterChips filters={filters} keep={keep} t={t.list} />
        </div>
        <SelectField
          id="list-sort"
          label={t.list.sortBy}
          value={navigation.sort}
          options={sortOptions.map((value) => ({ value, label: t.list.sortOptions[value] }))}
          onValueChange={(value) => navigation.apply(parseResidenceSort(value))}
        />
      </div>
      <div className="flex flex-col gap-4 pt-2">
        <div aria-live="polite" className="flex items-center justify-between gap-4">
          <p className="text-body-l text-foreground">
            {fillTemplate(t.list.headingShort, {
              count: result.matching,
              noun: residenceNoun(result.matching, filters.bedrooms, t.list),
            })}
          </p>
          <p className="text-caption whitespace-nowrap text-muted-foreground">
            {fillTemplate(t.list.availableCount, { available: result.available })}
          </p>
        </div>
        <ul className={cn("flex flex-col gap-4 transition-opacity", navigation.pending && "opacity-50")}>
          {residences.slice(0, pages.shown).map((residence) => (
            <li key={residence.number}>
              <ResidenceCard residence={residence} t={t} />
            </li>
          ))}
        </ul>
        <ShowMore
          shown={pages.shown}
          total={residences.length}
          hasMore={pages.hasMore}
          onMore={pages.showMore}
          t={t.list}
          className="pt-4"
        />
      </div>
    </div>
  );
}
