import type { Dictionary } from "@/content";
import { residencesHref } from "@/content/navigation";
import { emptyFilters, filtersToSearch, type KeptParams, type ResidenceFilters } from "@/lib/residence-filters";
import { sortParam, type ResidenceSort } from "@/lib/residence-sort";
import type { ResidencesData } from "@/lib/residences-data";

import { FloorGrid } from "./grid/floor-grid";
import { ListDesktop } from "./list/list-desktop";
import { ListMobile } from "./list/list-mobile";
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
  if (!data.residences) {
    return (
      <p role="alert" className="container-page py-16 text-body text-muted-foreground lg:py-24">
        {t.residences.viewUnavailable}
      </p>
    );
  }

  if (data.matching.length === 0) {
    return <NoMatches resetHref={`${residencesHref}${filtersToSearch(emptyFilters, keep)}`} t={t.residences} />;
  }

  const listKey = `${filtersToSearch(filters)}${sort}`;
  const listText = { list: t.list, floorPage: t.floorPage, status: t.status };
  const mobileList = (
    <ListMobile
      key={listKey}
      residences={data.matching}
      result={data.result}
      filters={filters}
      priceRange={data.priceRange}
      sort={sort}
      view={view}
      keep={keep}
      t={{ ...listText, filters: t.filters }}
    />
  );

  if (view === "list") {
    return (
      <>
        <div className="hidden lg:block">
          <ListDesktop
            key={listKey}
            residences={data.matching}
            result={data.result}
            filters={filters}
            sort={sort}
            view={view}
            t={listText}
          />
        </div>
        <div className="lg:hidden">{mobileList}</div>
      </>
    );
  }

  return (
    <>
      <div className="hidden lg:block">
        <FloorGrid
          residences={data.residences}
          matching={data.matching}
          filters={filters}
          priceRange={data.priceRange}
          listHref={`${residencesHref}${filtersToSearch(filters, { view: "list", sort: sortParam(sort) })}`}
          t={t}
        />
      </div>
      <div className="lg:hidden">{mobileList}</div>
    </>
  );
}
