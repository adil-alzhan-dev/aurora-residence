"use client";

import { Switcher, type SwitcherOption } from "@/components/ui/switcher";
import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate } from "@/lib/format";
import type { FilterResult, ResidenceFilters } from "@/lib/residence-filters";
import { sortOptions, type ResidenceSort } from "@/lib/residence-sort";
import { cn } from "@/lib/utils";

import { ListTable } from "./list-table";
import { residenceNoun } from "./list-text";
import { ShowMore } from "./show-more";
import { useShowMore } from "./use-show-more";
import { useSortNavigation } from "./use-sort-navigation";

const PAGE_SIZE = 10;

type ListDesktopProps = {
  residences: Residence[];
  result: FilterResult;
  filters: ResidenceFilters;
  sort: ResidenceSort;
  view: string;
  t: Pick<Dictionary, "list" | "floorPage" | "status">;
};

/** Desktop list: count and sort segments, the table, then "Show more" ten residences at a time. */
export function ListDesktop({ residences, result, filters, sort, view, t }: ListDesktopProps) {
  const navigation = useSortNavigation(sort, filters, view);
  const pages = useShowMore(residences.length, PAGE_SIZE);
  const options: SwitcherOption<ResidenceSort>[] = sortOptions.map((value) => ({
    value,
    label: t.list.sortOptions[value],
  }));

  return (
    <div className="container-page flex flex-col gap-8 pt-16 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <p aria-live="polite" className="text-body-l text-foreground">
          {fillTemplate(t.list.heading, {
            count: result.matching,
            noun: residenceNoun(result.matching, filters.bedrooms, t.list),
            available: result.available,
          })}
        </p>
        <div className="flex items-center gap-4">
          <p aria-hidden="true" className="text-label text-muted-foreground">
            {t.list.sortBy}
          </p>
          <Switcher label={t.list.sortBy} options={options} value={navigation.sort} onValueChange={navigation.apply} />
        </div>
      </div>
      <div className={cn("transition-opacity", navigation.pending && "opacity-50")}>
        <ListTable
          residences={residences.slice(0, pages.shown)}
          sort={navigation.sort}
          onSort={navigation.apply}
          t={t}
        />
      </div>
      <ShowMore shown={pages.shown} total={residences.length} hasMore={pages.hasMore} onMore={pages.showMore} t={t.list} />
    </div>
  );
}
