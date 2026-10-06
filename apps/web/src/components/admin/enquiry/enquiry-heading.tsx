import Link from "next/link";

import { EnquiryStatusBadge } from "@/components/admin/enquiry-status-badge";
import { ArrowRightIcon } from "@/components/icons";
import type { AdminDictionary } from "@/content/en-admin";
import { receivedLine } from "@/lib/admin/enquiry-view";
import { adminHref } from "@/lib/admin/paths";
import type { EnquiryCard } from "@/lib/admin/schemas";

export function BackToEnquiries({ label }: { label: string }) {
  return (
    <Link
      href={adminHref.enquiries}
      className="flex w-fit items-center gap-2 text-admin-strong text-foreground transition-colors duration-200 hover:text-primary"
    >
      <ArrowRightIcon className="rotate-180" />
      {label}
    </Link>
  );
}

export function EnquiryHeading({ enquiry, now, t }: { enquiry: EnquiryCard; now: Date; t: AdminDictionary }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-admin-title break-words text-foreground">{enquiry.name}</h1>
        <EnquiryStatusBadge status={enquiry.status} label={t.enquiries.statuses[enquiry.status]} />
      </div>
      <p className="text-admin-body text-muted-foreground">{receivedLine(enquiry, now, t.enquiry)}</p>
    </div>
  );
}
