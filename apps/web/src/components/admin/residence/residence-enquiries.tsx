"use client";

import Link from "next/link";

import { useAdminFormat } from "@/components/admin/admin-locale";
import { EnquiryStatusBadge } from "@/components/admin/enquiry-status-badge";
import type { AdminDictionary } from "@/content/en-admin";
import { formatReceived } from "@/lib/admin/dashboard-view";
import { adminHref } from "@/lib/admin/paths";
import { useResidenceEnquiries } from "@/lib/admin/queries";
import { fillTemplate } from "@/lib/format";

import { AdminCard } from "./admin-card";

type EnquiriesProps = { number: string; now: Date; t: AdminDictionary };

export function ResidenceEnquiries({ number, now, t }: EnquiriesProps) {
  const { data, isError } = useResidenceEnquiries(number);
  const text = t.residence.enquiries;
  const format = useAdminFormat();

  let body;
  if (isError && !data) body = <p className="text-admin-body text-muted-foreground">{text.failed}</p>;
  else if (!data) body = <div aria-hidden="true" className="h-16 animate-pulse bg-background" />;
  else if (data.items.length === 0) body = <p className="text-admin-body text-muted-foreground">{text.empty}</p>;
  else {
    body = (
      <ul className="flex flex-col">
        {data.items.map((item) => (
          <li key={item.id} className="relative flex items-center justify-between gap-4 border-t border-border py-3">
            <div className="flex min-w-0 flex-col">
              <Link
                href={adminHref.enquiry(item.id)}
                aria-label={fillTemplate(text.openLabel, { name: item.name })}
                className="text-admin-strong text-foreground after:absolute after:inset-0 hover:text-primary"
              >
                {item.name}
              </Link>
              <span className="text-admin-caption text-muted-foreground">
                {formatReceived(item.createdAt, now, t.enquiries, format)}
                <span aria-hidden="true">{"  ·  "}</span>
                <span className="whitespace-nowrap">{item.phone}</span>
              </span>
            </div>
            <EnquiryStatusBadge status={item.status} label={t.enquiries.statuses[item.status]} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <AdminCard id="residence-enquiries" title={fillTemplate(text.title, { number })} className="gap-3">
      {body}
    </AdminCard>
  );
}
