import Link from "next/link";

import type { Dictionary } from "@/content";
import { residencesHref, type ResidenceView } from "@/content/navigation";
import { emptyFilters, filtersToSearch, type ResidenceFilters } from "@/lib/residence-filters";
import { DEFAULT_SORT, sortParam, type ResidenceSort } from "@/lib/residence-sort";
import { cn } from "@/lib/utils";

const views: ResidenceView[] = ["facade", "grid", "list"];

type ViewLinksProps = {
  t: Pick<Dictionary["residencePicker"], "views" | "viewsLabel">;
  current: ResidenceView;
  filters?: ResidenceFilters;
  sort?: ResidenceSort;
};

const stateClass = {
  current: "border-primary text-foreground",
  idle: "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
  currentOnPhone:
    "max-lg:border-primary max-lg:text-foreground lg:border-transparent lg:text-muted-foreground lg:hover:border-border lg:hover:text-foreground",
};

/** Switching views keeps the filters and the sort order in the address. */
export function ViewLinks({ t, current, filters = emptyFilters, sort = DEFAULT_SORT }: ViewLinksProps) {
  const hrefFor = (view: ResidenceView) =>
    `${residencesHref}${filtersToSearch(filters, { view: view === "facade" ? null : view, sort: sortParam(sort) })}`;

  return (
    <nav aria-label={t.viewsLabel}>
      <ul className="flex items-center gap-1">
        {views.map((view) => {
          const isCurrent = view === current;
          // Phones have no floor grid, so ?view=grid shows the list there.
          const isCurrentOnPhone = view === "list" && current === "grid";
          return (
            <li key={view} className={cn(view === "grid" && "hidden lg:block")}>
              <Link
                href={hrefFor(view)}
                prefetch={false}
                aria-current={isCurrent ? "true" : undefined}
                className={cn(
                  "flex border-b px-3 py-3.5 text-label transition-colors duration-200 lg:py-2",
                  stateClass[isCurrent ? "current" : isCurrentOnPhone ? "currentOnPhone" : "idle"],
                )}
              >
                {t.views[view]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
