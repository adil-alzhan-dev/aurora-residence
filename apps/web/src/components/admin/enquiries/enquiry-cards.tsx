import Link from "next/link";

import { useAdminFormat } from "@/components/admin/admin-locale";
import { EnquiryStatusBadge } from "@/components/admin/enquiry-status-badge";
import { ArrowRightIcon } from "@/components/icons";
import type { AdminDictionary } from "@/content/en-admin";
import { formatReceived } from "@/lib/admin/dashboard-view";
import { pageCount } from "@/lib/admin/enquiry-filters";
import { adminHref } from "@/lib/admin/paths";
import type { AdminEnquiryListItem } from "@/lib/admin/schemas";
import { fillTemplate, joinPhrase } from "@/lib/format";
import { cn } from "@/lib/utils";

type CardsProps = {
  items: AdminEnquiryListItem[];
  page: number;
  total: number;
  now: Date;
  t: AdminDictionary;
};

/** New enquiries keep the desktop marks: a lighter fill, a bronze edge and a bold name. */
function EnquiryCard({ item, now, t }: Pick<CardsProps, "now" | "t"> & { item: AdminEnquiryListItem }) {
  const text = t.enquiries;
  const format = useAdminFormat();
  const isNew = item.status === "NEW";
  const received = formatReceived(item.createdAt, now, text, format);
  const residence = item.residence ? fillTemplate(text.residence, { number: item.residence }) : text.general;
  const label = joinPhrase([
    fillTemplate(text.openLabel, { name: item.name }),
    text.statuses[item.status],
    residence,
    received,
  ]);

  return (
    <Link
      href={adminHref.enquiry(item.id)}
      aria-label={label}
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-base border border-border p-4 transition-colors duration-200 hover:border-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        isNew ? "bg-background" : "bg-card",
        item.status === "CLOSED" ? "text-muted-foreground" : "text-foreground",
      )}
    >
      {isNew && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}
      <span className="flex items-start justify-between gap-3">
        <span className={cn("min-w-0 [overflow-wrap:anywhere]", isNew ? "text-admin-strong" : "text-admin-body")}>
          {item.name}
        </span>
        <EnquiryStatusBadge status={item.status} label={text.statuses[item.status]} />
      </span>
      <span className="flex items-end justify-between gap-3">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-admin-body">{residence}</span>
          <span className={cn("text-admin-caption", isNew ? "text-foreground" : "text-muted-foreground")}>{received}</span>
        </span>
        <ArrowRightIcon className="mb-0.5 shrink-0 text-foreground" />
      </span>
    </Link>
  );
}

export function EnquiryCards({ items, page, total, now, t }: CardsProps) {
  return (
    <ul
      aria-label={fillTemplate(t.enquiryList.tableLabel, { page, pages: pageCount(total) })}
      className="flex flex-col gap-2"
    >
      {items.map((item) => (
        <li key={item.id}>
          <EnquiryCard item={item} now={now} t={t} />
        </li>
      ))}
    </ul>
  );
}
