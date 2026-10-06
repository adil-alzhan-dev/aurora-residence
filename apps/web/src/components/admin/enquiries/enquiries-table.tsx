import type { AdminDictionary } from "@/content/en-admin";
import { pageCount, pageRange } from "@/lib/admin/enquiry-filters";
import type { AdminEnquiryListItem, ResidenceBrief } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { EnquiryRow } from "./enquiry-row";

type TableProps = {
  items: AdminEnquiryListItem[];
  residences: Map<string, ResidenceBrief>;
  page: number;
  total: number;
  now: Date;
  t: AdminDictionary;
};

const head = "h-10 pr-4 text-left text-label font-semibold text-muted-foreground";

export function EnquiriesTable({ items, residences, page, total, now, t }: TableProps) {
  const { columns } = t.enquiries;
  return (
    <div className="overflow-x-auto rounded-base border border-border bg-card">
      <table className="w-full border-collapse">
        <caption className="sr-only">
          {fillTemplate(t.enquiryList.tableLabel, { page, pages: pageCount(total) })}
        </caption>
        <thead className="border-b border-border bg-background">
          <tr>
            <th scope="col" className={cn(head, "hidden pl-4 sm:table-cell")}>
              {columns.received}
            </th>
            <th scope="col" className={cn(head, "pl-4 sm:pl-0")}>
              {columns.client}
            </th>
            <th scope="col" className={cn(head, "hidden md:table-cell")}>
              {columns.phone}
            </th>
            <th scope="col" className={cn(head, "hidden lg:table-cell")}>
              {columns.residence}
            </th>
            <th scope="col" className={head}>
              {columns.status}
            </th>
            <th scope="col" className={cn(head, "hidden sm:table-cell")}>
              <span className="sr-only">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <EnquiryRow
              key={item.id}
              item={item}
              residence={item.residence ? residences.get(item.residence) : undefined}
              now={now}
              t={t}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type PagerProps = {
  page: number;
  total: number;
  onPage: (page: number) => void;
  t: AdminDictionary["enquiryList"];
};

export function EnquiriesPager({ page, total, onPage, t }: PagerProps) {
  const pages = pageCount(total);
  if (pages <= 1) return null;
  const range = pageRange(page, total);
  const button =
    "flex h-10 items-center rounded-base border border-border bg-card px-4 text-admin-body text-foreground transition-colors duration-200 hover:border-foreground disabled:pointer-events-none disabled:text-disabled-foreground";
  return (
    <nav aria-label={t.pagination} className="flex flex-wrap items-center justify-between gap-3">
      <p aria-live="polite" className="text-admin-caption text-muted-foreground">
        {fillTemplate(t.showing, { from: range.from, to: range.to, total })}
      </p>
      <div className="flex gap-2">
        <button type="button" className={button} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          {t.previous}
        </button>
        <button type="button" className={button} disabled={page >= pages} onClick={() => onPage(page + 1)}>
          {t.next}
        </button>
      </div>
    </nav>
  );
}
