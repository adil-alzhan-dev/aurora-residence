"use client";

import Link from "next/link";

import { useCurrency } from "@/components/currency/currency-provider";
import { Button, ButtonArrow } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import type { Residence, ResidenceStatus } from "@/lib/api/residences";
import { fillTemplate } from "@/lib/format";
import type { FormatPrice } from "@/lib/money";
import type { ResidenceFilters } from "@/lib/residence-filters";
import { cn } from "@/lib/utils";

import type { PriceRange } from "../filters/filter-fields";

type GridSummaryProps = {
  residences: Residence[];
  matching: Residence[];
  filters: ResidenceFilters;
  priceRange: PriceRange | null;
  listHref: string;
  t: Pick<Dictionary, "grid" | "filters" | "floorPage" | "status">;
};

const statuses: ResidenceStatus[] = ["available", "reserved", "sold"];

const dotClass: Record<ResidenceStatus, string> = {
  available: "bg-status-free",
  reserved: "bg-status-reserved",
  sold: "bg-status-sold",
};

const rowClass = "flex items-center gap-3 border-b border-border py-3 text-body text-foreground";

function describeFilters(
  filters: ResidenceFilters,
  range: PriceRange | null,
  t: GridSummaryProps["t"],
  formatPrice: FormatPrice,
) {
  const type = filters.bedrooms === null ? t.grid.anyType : t.floorPage.typeNames[filters.bedrooms];
  const floor = filters.floor === null ? t.grid.anyFloor : fillTemplate(t.grid.floorNumber, { floor: filters.floor });
  const price = range
    ? fillTemplate(t.filters.priceRange, { min: formatPrice(range.min), max: formatPrice(filters.maxPrice ?? range.max) })
    : t.filters.anyPrice;
  return fillTemplate(t.grid.filtersText, { type: type ?? t.grid.anyType, floor, price });
}

/** Right column of the Floor grid frame: the whole house by status, then the result of the filters. */
export function GridSummary({ residences, matching, filters, priceRange, listHref, t }: GridSummaryProps) {
  const { formatPrice } = useCurrency();
  const counts = statuses.map((status) => ({
    status,
    count: residences.filter((residence) => residence.status === status).length,
  }));
  const availablePrices = matching
    .filter((residence) => residence.status === "available")
    .map((residence) => residence.priceUsd);

  const filterStats = [
    { label: t.grid.matching, value: String(matching.length) },
    { label: t.grid.availableNow, value: String(availablePrices.length) },
    {
      label: t.grid.pricesFrom,
      value: availablePrices.length > 0 ? formatPrice(Math.min(...availablePrices)) : t.grid.noneAvailable,
    },
  ];

  return (
    <aside
      aria-labelledby="grid-summary-title"
      className="flex flex-col gap-6 self-start rounded-base border border-border bg-card p-8"
    >
      <div className="flex flex-col gap-2">
        <p className="text-overline text-primary">{t.grid.summaryOverline}</p>
        <h2 id="grid-summary-title" className="text-h3 text-foreground">
          {t.grid.summaryTitle}
        </h2>
      </div>
      <dl>
        {counts.map(({ status, count }) => (
          <div key={status} className={rowClass}>
            <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", dotClass[status])} />
            <dt className="flex-1">{t.status[status]}</dt>
            <dd>{count}</dd>
          </div>
        ))}
      </dl>
      <div aria-hidden="true" className="flex h-1.5 gap-0.5">
        {counts.map(({ status, count }) => (
          <span key={status} className={dotClass[status]} style={{ flexGrow: count }} />
        ))}
      </div>
      <div className="flex flex-col gap-2 pt-4">
        <p className="text-overline text-primary">{t.grid.yourFilters}</p>
        <p className="text-body text-muted-foreground">{describeFilters(filters, priceRange, t, formatPrice)}</p>
      </div>
      <dl>
        {filterStats.map((stat) => (
          <div key={stat.label} className={rowClass}>
            <dt className="flex-1">{stat.label}</dt>
            <dd className="whitespace-nowrap">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <Button asChild className="w-full">
        <Link href={listHref} prefetch={false}>
          {fillTemplate(t.grid.showInList, { count: matching.length })}
          <ButtonArrow />
        </Link>
      </Button>
    </aside>
  );
}
