import Link from "next/link";

import { useAdminFormat } from "@/components/admin/admin-locale";
import { EnquiryStatusBadge } from "@/components/admin/enquiry-status-badge";
import { ArrowRightIcon } from "@/components/icons";
import type { AdminDictionary } from "@/content/en-admin";
import { sourceText } from "@/lib/admin/api-texts";
import { formatReceived, residenceDetails } from "@/lib/admin/dashboard-view";
import { adminHref } from "@/lib/admin/paths";
import type { AdminEnquiryListItem, ResidenceBrief } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";
import { cn } from "@/lib/utils";

type RowProps = {
  item: AdminEnquiryListItem;
  residence: ResidenceBrief | undefined;
  now: Date;
  t: AdminDictionary;
};

const cell = "py-3 pr-4 align-middle";

function ResidenceText({ item, residence, t }: Omit<RowProps, "now">) {
  const text = t.enquiries;
  const format = useAdminFormat();
  if (!item.residence) {
    return (
      <>
        <span className="block text-admin-body">{text.general}</span>
        <span className="block text-admin-caption text-muted-foreground">{sourceText(item.source, t.messages)}</span>
      </>
    );
  }
  return (
    <>
      <span className="block text-admin-body">{fillTemplate(text.residence, { number: item.residence })}</span>
      {residence && (
        <span className="block text-admin-caption whitespace-nowrap text-muted-foreground">
          {residenceDetails(residence, text, format)}
        </span>
      )}
    </>
  );
}

/** The client name link covers the whole row, so a click or Enter anywhere opens the enquiry. */
export function EnquiryRow({ item, residence, now, t }: RowProps) {
  const text = t.enquiries;
  const format = useAdminFormat();
  const isNew = item.status === "NEW";
  const isClosed = item.status === "CLOSED";
  const strong = isNew ? "text-admin-strong" : "text-admin-body";
  return (
    <tr
      className={cn(
        "relative border-b border-border transition-colors duration-200 last:border-b-0 hover:bg-background",
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-primary",
        isNew ? "bg-background" : "bg-card",
        isClosed ? "text-muted-foreground" : "text-foreground",
      )}
    >
      <td className={cn(cell, "hidden pl-4 whitespace-nowrap sm:table-cell md:w-44", strong)}>
        {formatReceived(item.createdAt, now, text, format)}
      </td>
      <th scope="row" className={cn(cell, "min-w-0 pl-4 text-left font-normal sm:pl-0 md:w-70")}>
        {isNew && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}
        <span className={cn("block text-admin-caption sm:hidden", isNew ? "text-foreground" : "text-muted-foreground")}>
          {formatReceived(item.createdAt, now, text, format)}
        </span>
        <Link
          href={adminHref.enquiry(item.id)}
          aria-label={fillTemplate(text.openLabel, { name: item.name })}
          className={cn("block outline-none after:absolute after:inset-0 after:content-['']", strong)}
        >
          {item.name}
        </Link>
        <span className="block text-admin-caption [overflow-wrap:anywhere] text-muted-foreground">{item.email}</span>
        <span className="block text-admin-caption text-muted-foreground md:hidden">{item.phone}</span>
        <span className="block text-admin-caption text-muted-foreground lg:hidden">
          {item.residence ? fillTemplate(text.residence, { number: item.residence }) : text.general}
        </span>
      </th>
      <td className={cn(cell, "hidden text-admin-body whitespace-nowrap md:table-cell md:w-50")}>{item.phone}</td>
      <td className={cn(cell, "hidden lg:table-cell lg:w-50")}>
        <ResidenceText item={item} residence={residence} t={t} />
      </td>
      <td className={cn(cell, "whitespace-nowrap md:w-44")}>
        <EnquiryStatusBadge status={item.status} label={text.statuses[item.status]} />
      </td>
      <td aria-hidden="true" className={cn(cell, "hidden sm:table-cell")}>
        <span className="flex items-center justify-end gap-2 text-admin-strong text-foreground">
          {text.open}
          <ArrowRightIcon />
        </span>
      </td>
    </tr>
  );
}
