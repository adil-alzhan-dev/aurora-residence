"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { DashboardError } from "@/components/admin/dashboard/dashboard-states";
import { RowStatusControl } from "@/components/admin/residence/status-change-dialog";
import type { AdminDictionary } from "@/content/en-admin";
import { FLOOR_COUNT, RESIDENCES_PER_FLOOR } from "@/lib/building";
import { useAdminResidences } from "@/lib/admin/queries";
import {
  filtersToSearch,
  parseResidenceFilters,
  visibleResidences,
  type ResidenceFilters,
} from "@/lib/admin/residence-filters";
import { fillTemplate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ResidenceCards } from "./residence-cards";
import { ResidencesFilters } from "./residences-filters";
import { ResidencesTable } from "./residences-table";

const NO_FILTERS = { search: "", floor: null };

function HouseTotals({ t }: { t: AdminDictionary["residences"] }) {
  const { data } = useAdminResidences(NO_FILTERS);
  if (!data) return null;
  const items = [
    { dot: "bg-status-free", text: fillTemplate(t.totalAvailable, { count: data.counts.AVAILABLE }) },
    { dot: "bg-status-reserved", text: fillTemplate(t.totalReserved, { count: data.counts.RESERVED }) },
    { dot: "bg-status-sold", text: fillTemplate(t.totalSold, { count: data.counts.SOLD }) },
  ];
  return (
    <ul aria-label={t.totals} className="flex flex-wrap gap-x-4 gap-y-1">
      {items.map((item) => (
        <li key={item.dot} className="flex items-center gap-2 text-admin-body text-foreground">
          <span aria-hidden="true" className={cn("size-2 rounded-full", item.dot)} />
          {item.text}
        </li>
      ))}
    </ul>
  );
}

function TableSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="h-[600px] animate-pulse rounded-base border border-border bg-card">
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ResidencesView({ t }: { t: AdminDictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseResidenceFilters(searchParams);
  const query = useAdminResidences({ search: filters.search, floor: filters.floor });
  const text = t.residences;

  const change = useCallback(
    (next: Partial<ResidenceFilters>) => {
      const current = parseResidenceFilters(new URLSearchParams(window.location.search));
      router.replace(`${pathname}${filtersToSearch({ ...current, ...next })}`, { scroll: false });
    },
    [pathname, router],
  );

  const items = query.data ? visibleResidences(query.data.items, filters.status) : [];

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-admin-title text-foreground">{text.title}</h1>
          <p className="text-admin-body text-muted-foreground">
            {fillTemplate(text.lead, { total: FLOOR_COUNT * RESIDENCES_PER_FLOOR, floors: FLOOR_COUNT })}
          </p>
        </div>
        <HouseTotals t={text} />
      </div>
      <ResidencesFilters
        filters={filters}
        counts={query.data?.counts}
        shown={items.length}
        onChange={change}
        t={text}
        statuses={t.facade.statuses}
      />
      {query.isError && !query.data ? (
        <DashboardError t={t.states} onRetry={() => void query.refetch()} />
      ) : !query.data ? (
        <TableSkeleton label={t.states.loading} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-base border border-border bg-card p-6">
          <p className="text-admin-body text-muted-foreground">{text.empty}</p>
          <button
            type="button"
            onClick={() => change({ search: "", floor: null, status: null })}
            className="text-admin-strong text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            {text.reset}
          </button>
        </div>
      ) : (
        <>
          <div className="md:hidden">
            <ResidenceCards items={items} t={text} statuses={t.facade.statuses} />
          </div>
          <div className="max-md:hidden">
            <ResidencesTable
              items={items}
              t={text}
              renderStatus={(residence) => <RowStatusControl residence={residence} t={t} />}
            />
          </div>
        </>
      )}
    </>
  );
}
