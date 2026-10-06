import Link from "next/link";

import { EnquiryStatusBadge } from "@/components/admin/enquiry-status-badge";
import { ArrowRightIcon } from "@/components/icons";
import type { AdminDictionary } from "@/content/en-admin";
import { formatReceived, residenceDetails } from "@/lib/admin/dashboard-view";
import { adminHref } from "@/lib/admin/paths";
import type { AdminEnquiryListItem, AdminResidence } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { DashboardCard } from "./dashboard-card";

type LatestEnquiriesProps = {
  items: AdminEnquiryListItem[];
  total: number;
  residences: Map<string, AdminResidence>;
  now: Date;
  t: AdminDictionary["enquiries"];
};

function ResidenceCell({ item, residences, t }: Pick<LatestEnquiriesProps, "residences" | "t"> & { item: AdminEnquiryListItem }) {
  const residence = item.residence ? residences.get(item.residence) : undefined;
  return (
    <div className="flex flex-col lg:w-50 lg:shrink-0">
      <span className="text-admin-body text-foreground">
        {item.residence ? fillTemplate(t.residence, { number: item.residence }) : t.general}
      </span>
      <span className="text-admin-caption text-muted-foreground">
        {item.residence ? residence && residenceDetails(residence, t) : item.source}
      </span>
    </div>
  );
}

function EnquiryRow({ item, residences, now, t }: Omit<LatestEnquiriesProps, "items" | "total"> & { item: AdminEnquiryListItem }) {
  const isNew = item.status === "NEW";
  const strong = isNew ? "text-admin-strong" : "text-admin-body";
  return (
    <li
      className={cn(
        "relative grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-b border-border px-4 py-3 last:border-b-0 lg:flex lg:items-center lg:gap-0",
        isNew ? "bg-background" : "bg-card",
      )}
    >
      {isNew && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}
      <span className={cn("text-foreground lg:w-40 lg:shrink-0", strong)}>{formatReceived(item.createdAt, now, t)}</span>
      <span className="justify-self-end lg:order-last lg:hidden">
        <EnquiryStatusBadge status={item.status} label={t.statuses[item.status]} />
      </span>
      <div className="col-span-2 flex min-w-0 flex-col lg:w-70 lg:shrink-0">
        <span className={cn("truncate text-foreground", strong)}>{item.name}</span>
        <span className="truncate text-admin-caption text-muted-foreground">{item.email}</span>
      </div>
      <span className="text-admin-body text-foreground lg:w-50 lg:shrink-0">{item.phone}</span>
      <ResidenceCell item={item} residences={residences} t={t} />
      <span className="hidden lg:block lg:w-44 lg:shrink-0">
        <EnquiryStatusBadge status={item.status} label={t.statuses[item.status]} />
      </span>
      <Link
        href={adminHref.enquiry(item.id)}
        aria-label={fillTemplate(t.openLabel, { name: item.name })}
        className="col-span-2 flex min-h-11 items-center gap-2 justify-self-start text-admin-strong text-foreground transition-colors duration-200 hover:text-primary lg:ml-auto lg:min-h-0"
      >
        {t.open}
        <ArrowRightIcon />
      </Link>
    </li>
  );
}

export function LatestEnquiries({ items, total, residences, now, t }: LatestEnquiriesProps) {
  return (
    <DashboardCard
      id="dashboard-enquiries"
      title={t.title}
      lead={fillTemplate(t.lead, { shown: items.length, total })}
      action={{ href: adminHref.enquiries, label: t.all }}
      className="gap-4 overflow-hidden pt-6"
      headerClassName="px-6 max-sm:flex-col max-sm:items-start"
    >
      {items.length === 0 ? (
        <p className="border-t border-border px-6 py-6 text-admin-body text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="flex flex-col border-t border-border">
          {items.map((item) => (
            <EnquiryRow key={item.id} item={item} residences={residences} now={now} t={t} />
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
