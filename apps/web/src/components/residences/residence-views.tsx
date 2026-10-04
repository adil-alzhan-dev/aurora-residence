import type { Dictionary } from "@/content";
import { residencesHref } from "@/content/navigation";
import { emptyFilters, filtersToSearch, type KeptParams, type ResidenceFilters } from "@/lib/residence-filters";
import { sortParam, type ResidenceSort } from "@/lib/residence-sort";
import type { ResidencesData } from "@/lib/residences-data";

import { FloorGrid } from "./grid/floor-grid";
import { ListDesktop } from "./list/list-desktop";
import { ListMobile } from "./list/list-mobile";
import { MobileFilterRow } from "./list/mobile-filter-row";
import { NoMatches } from "./no-matches";

type ResidenceViewsProps = {
  view: "grid" | "list";
  data: ResidencesData;
  filters: ResidenceFilters;
  sort: ResidenceSort;
  keep: KeptParams;
  t: Dictionary;
};

/** Floor grid (desktop only) and list: phones get the list for ?view=grid as well. */
export function ResidenceViews({ view, data, filters, sort, keep, t }: ResidenceViewsProps) {
  if (!data.residences || !data.result) {
    return (
      <p role="alert" className="container-page py-16 text-body text-muted-foreground lg:py-24">
        {t.residences.viewUnavailable}
      </p>
    );
  }

  const shared = { filters, sort, keep, result: data.result, priceRange: data.priceRange };

  if (data.matching.length === 0) {
    return (
      <>
        <div className="container-page lg:hidden">
          <MobileFilterRow {...shared} t={{ list: t.list, filters: t.filters }} />
        </div>
        <NoMatches resetHref={`${residencesHref}${filtersToSearch(emptyFilters, keep)}`} t={t.residences} />
      </>
    );
  }

  // A new sort or filter starts the list again from its first page.
  const listKey = `${filtersToSearch(filters)}${sort}`;
  const listText = { list: t.list, floorPage: t.floorPage, status: t.status };

  return (
    <>
      <div className="hidden lg:block">
        {view === "list" ? (
          <ListDesktop key={listKey} {...shared} residences={data.matching} view={view} t={listText} />
        ) : (
          <FloorGrid
            residences={data.residences}
            matching={data.matching}
            filters={filters}
            priceRange={data.priceRange}
            listHref={`${residencesHref}${filtersToSearch(filters, { view: "list", sort: sortParam(sort) })}`}
            t={t}
          />
        )}
      </div>
      <div className="lg:hidden">
        <ListMobile
          key={listKey}
          {...shared}
          residences={data.matching}
          view={view}
          t={{ ...listText, filters: t.filters }}
        />
      </div>
    </>
  );
}
