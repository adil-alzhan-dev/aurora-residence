"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { DashboardError } from "@/components/admin/dashboard/dashboard-states";
import type { AdminDictionary } from "@/content/en-admin";
import {
  enquiryFiltersToSearch,
  nextEnquiryFilters,
  parseEnquiryFilters,
  type EnquiryFilters,
} from "@/lib/admin/enquiry-filters";
import { useAdminEnquiries, useEnquiryCounts } from "@/lib/admin/enquiry-queries";
import { useAdminResidences } from "@/lib/admin/queries";
import type { ResidenceBrief } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";

import { EnquiriesFilters } from "./enquiries-filters";
import { EnquiriesPager, EnquiriesTable } from "./enquiries-table";

const NO_RESIDENCE_FILTERS = { search: "", floor: null };
const NO_ENQUIRY_FILTERS = { search: "", residence: null };

/** Bedrooms, area and price for the residence column come from the residences list, by number. */
function useResidenceBriefs() {
  const { data } = useAdminResidences(NO_RESIDENCE_FILTERS);
  return useMemo(() => {
    const items = [...(data?.items ?? [])].sort((a, b) => a.floor - b.floor || a.position - b.position);
    const briefs = new Map<string, ResidenceBrief>(items.map((item) => [item.number, item]));
    return { briefs, numbers: items.map((item) => item.number) };
  }, [data]);
}

function Heading({ t }: { t: AdminDictionary["enquiryList"] }) {
  const counts = useEnquiryCounts(NO_ENQUIRY_FILTERS);
  const total = counts?.ALL;
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-admin-title text-foreground">{t.title}</h1>
      {total !== undefined && (
        <p className="text-admin-body text-muted-foreground">
          {total === 1 ? t.leadOne : fillTemplate(t.lead, { total })}
        </p>
      )}
    </div>
  );
}

function TableSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="h-[600px] animate-pulse rounded-base border border-border bg-card">
      <span className="sr-only">{label}</span>
    </div>
  );
}

function EmptyState({ filtered, onReset, t }: { filtered: boolean; onReset: () => void; t: AdminDictionary["enquiryList"] }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-base border border-border bg-card p-6">
      <p className="text-admin-body text-muted-foreground">{filtered ? t.empty : t.emptyAll}</p>
      {filtered && (
        <button
          type="button"
          onClick={onReset}
          className="text-admin-strong text-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          {t.reset}
        </button>
      )}
    </div>
  );
}

export function EnquiriesView({ t }: { t: AdminDictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseEnquiryFilters(searchParams);
  const query = useAdminEnquiries(filters);
  const counts = useEnquiryCounts({ search: filters.search, residence: filters.residence });
  const { briefs, numbers } = useResidenceBriefs();
  const [now] = useState(() => new Date());
  const text = t.enquiryList;

  const change = useCallback(
    (next: Partial<EnquiryFilters>) => {
      const current = parseEnquiryFilters(new URLSearchParams(window.location.search));
      router.replace(`${pathname}${enquiryFiltersToSearch(nextEnquiryFilters(current, next))}`, { scroll: false });
    },
    [pathname, router],
  );
  const filtered = Boolean(filters.search || filters.status || filters.residence || filters.page > 1);

  let body;
  if (query.isError && !query.data) body = <DashboardError t={t.states} onRetry={() => void query.refetch()} />;
  else if (!query.data) body = <TableSkeleton label={t.states.loading} />;
  else if (query.data.items.length === 0) {
    body = <EmptyState filtered={filtered} onReset={() => router.replace(pathname, { scroll: false })} t={text} />;
  } else {
    body = (
      <>
        <EnquiriesTable
          items={query.data.items}
          residences={briefs}
          page={filters.page}
          total={query.data.total}
          now={now}
          t={t}
        />
        <EnquiriesPager page={filters.page} total={query.data.total} onPage={(page) => change({ page })} t={text} />
      </>
    );
  }

  return (
    <>
      <Heading t={text} />
      <EnquiriesFilters filters={filters} counts={counts} residenceNumbers={numbers} onChange={change} t={t} />
      {body}
    </>
  );
}
