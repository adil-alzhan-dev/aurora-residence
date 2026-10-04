import type { Dictionary } from "@/content";
import type { ResidenceView } from "@/content/navigation";
import { revealDelay } from "@/lib/motion";
import type { FilterResult, ResidenceFilters } from "@/lib/residence-filters";

import { FiltersBar } from "./filters/filters-bar";
import { FiltersSheet } from "./filters/filters-sheet";
import type { PriceRange } from "./filters/filter-fields";
import { ViewLinks } from "./view-links";

type ResidencesIntroProps = {
  view: ResidenceView;
  filters: ResidenceFilters;
  result: FilterResult | null;
  priceRange: PriceRange | null;
  t: Pick<Dictionary, "residences" | "residencePicker" | "filters">;
};

/** Title, Facade / Floor grid / List and the filters: shared by all three ways to choose. */
export function ResidencesIntro({ view, filters, result, priceRange, t }: ResidencesIntroProps) {
  const filterProps = { filters, result, priceRange, view: view === "facade" ? null : view, t: t.filters };

  return (
    <>
      <div className="container-page lg:flex lg:items-end lg:justify-between lg:pt-16 lg:pb-12">
        <div data-reveal="up" className="flex max-w-[624px] flex-col gap-4 max-lg:sr-only">
          <p className="text-overline text-primary">{t.residences.overline}</p>
          <h1 id="residences-title" className="text-h1 text-foreground">
            {t.residences.title}
          </h1>
          <p className="max-w-[520px] text-body text-muted-foreground">{t.residences.lead}</p>
        </div>
        <div data-reveal="up" style={revealDelay(120)} className="hidden lg:block">
          <ViewLinks t={t.residencePicker} current={view} />
        </div>
      </div>

      <div className="container-page flex items-center justify-between gap-4 pt-2 pb-2 lg:hidden">
        <ViewLinks t={t.residencePicker} current={view} />
        <FiltersSheet {...filterProps} theme="dark" />
      </div>

      <FiltersBar {...filterProps} />
    </>
  );
}
