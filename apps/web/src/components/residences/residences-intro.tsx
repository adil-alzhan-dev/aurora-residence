import type { Dictionary } from "@/content";
import type { ResidenceView } from "@/content/navigation";
import { revealDelay } from "@/lib/motion";
import type { FilterResult, KeptParams, ResidenceFilters } from "@/lib/residence-filters";
import type { ResidenceSort } from "@/lib/residence-sort";
import { cn } from "@/lib/utils";

import { FiltersBar } from "./filters/filters-bar";
import { FiltersSheet } from "./filters/filters-sheet";
import type { PriceRange } from "./filters/filter-fields";
import { ViewLinks } from "./view-links";

type ResidencesIntroProps = {
  view: ResidenceView;
  filters: ResidenceFilters;
  sort: ResidenceSort;
  keep: KeptParams;
  result: FilterResult | null;
  priceRange: PriceRange | null;
  t: Pick<Dictionary, "residences" | "residencePicker" | "filters">;
};

/**
 * Title, Facade / Floor grid / List and the filters: shared by all three ways to choose.
 * On phones the facade keeps the title for screen readers only; the list shows it, as in Figma.
 */
export function ResidencesIntro({ view, filters, sort, keep, result, priceRange, t }: ResidencesIntroProps) {
  const filterProps = { filters, result, priceRange, keep, t: t.filters };
  const isFacade = view === "facade";
  const lead = { facade: t.residences.lead, grid: t.residences.leadGrid, list: t.residences.leadList }[view];
  const viewLinks = <ViewLinks t={t.residencePicker} current={view} filters={filters} sort={sort} />;

  return (
    <>
      <div className={cn("container-page lg:flex lg:items-end lg:justify-between lg:pt-16 lg:pb-12", !isFacade && "pt-6")}>
        <div data-reveal="up" className={cn("flex max-w-[624px] flex-col gap-4", isFacade && "max-lg:sr-only")}>
          <p className="text-overline text-primary">{t.residences.overline}</p>
          <h1 id="residences-title" className="text-h1 text-foreground">
            {t.residences.title}
          </h1>
          <p className="max-w-[520px] text-body text-muted-foreground">{lead}</p>
        </div>
        <div
          data-reveal="up"
          style={revealDelay(120)}
          className={cn(isFacade ? "hidden lg:block" : "-mx-3 pt-4 pb-6 lg:mx-0 lg:p-0")}
        >
          {viewLinks}
        </div>
      </div>

      {isFacade && (
        <div className="container-page flex items-center justify-between gap-4 pt-2 pb-2 lg:hidden">
          {viewLinks}
          <FiltersSheet {...filterProps} theme="dark" />
        </div>
      )}

      <FiltersBar {...filterProps} />
    </>
  );
}
