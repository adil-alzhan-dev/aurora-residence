import { CurrencyText } from "@/components/currency/currency-text";
import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate, padNumber } from "@/lib/format";
import { plural } from "@/lib/plural";
import { activeFilterCount, matchesFilters, type ResidenceFilters } from "@/lib/residence-filters";

import type { PriceRange } from "../filters/filter-fields";
import { GridCell } from "./grid-cell";
import { GridSummary } from "./grid-summary";

type FloorGridProps = {
  /** All residences, top floor first, positions left to right. */
  residences: Residence[];
  matching: Residence[];
  filters: ResidenceFilters;
  priceRange: PriceRange | null;
  listHref: string;
  t: Pick<Dictionary, "grid" | "filters" | "floorPage" | "status" | "locale">;
};

function groupByFloor(residences: Residence[]) {
  const floors = new Map<number, Residence[]>();
  for (const residence of residences) {
    floors.set(residence.floor, [...(floors.get(residence.floor) ?? []), residence]);
  }
  return [...floors.entries()];
}

/** Desktop only: eleven floors from top to bottom, six residences on each, filters mute what does not match. */
export function FloorGrid({ residences, matching, filters, priceRange, listHref, t }: FloorGridProps) {
  const floors = groupByFloor(residences);
  const columns = floors.at(-1)?.[1] ?? [];
  const filtered = activeFilterCount(filters) > 0;

  return (
    <div className="container-page grid gap-8 pt-16 pb-24 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-2">
        <table className="-m-2 w-[calc(100%+1rem)] table-fixed border-separate border-spacing-2">
          <caption className="sr-only">{fillTemplate(plural(residences.length, t.grid.title, t.locale.intl), { count: residences.length })}</caption>
          <thead>
            <tr className="text-label text-muted-foreground">
              <th scope="col" className="w-14 pb-2 text-left font-semibold">
                {t.grid.floor}
              </th>
              {columns.map((residence) => (
                <th key={residence.position} scope="col" className="pb-2 text-left font-semibold whitespace-pre">
                  {fillTemplate(t.grid.column, {
                    position: padNumber(residence.position),
                    type: t.filters.bedroomOptions[residence.bedrooms] ?? "",
                  })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {floors.map(([floor, onFloor]) => (
              <tr key={floor} className="group/row">
                <th
                  scope="row"
                  aria-label={fillTemplate(t.grid.floorLabel, { floor })}
                  className="text-left text-body font-normal text-muted-foreground transition-colors duration-200 group-has-[a:hover]/row:text-foreground group-has-[a:focus-visible]/row:text-foreground"
                >
                  {padNumber(floor)}
                </th>
                {onFloor.map((residence) => (
                  <td key={residence.number} className="h-px p-0">
                    <GridCell residence={residence} matches={matchesFilters(residence, filters)} t={t} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-caption text-muted-foreground">
          {filtered && `${t.grid.mutedNote} `}
          <CurrencyText template={t.grid.note} />
        </p>
      </div>
      <GridSummary
        residences={residences}
        matching={matching}
        filters={filters}
        priceRange={priceRange}
        listHref={listHref}
        t={t}
      />
    </div>
  );
}
