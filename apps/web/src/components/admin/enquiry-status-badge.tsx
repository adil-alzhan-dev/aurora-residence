import { cva } from "class-variance-authority";

import type { AdminEnquiryStatus } from "@/lib/admin/schemas";

const badge = cva("inline-flex items-center gap-1.5 rounded-base px-2 py-1 text-label whitespace-nowrap", {
  variants: {
    status: {
      NEW: "bg-primary text-primary-foreground",
      IN_PROGRESS: "border border-border bg-card text-foreground",
      CLOSED: "bg-status-sold-subtle text-muted-foreground",
    },
  },
});

const dot = cva("size-1.5 shrink-0 rounded-full", {
  variants: {
    status: {
      NEW: "bg-primary-foreground",
      IN_PROGRESS: "bg-primary",
      CLOSED: "bg-status-sold",
    },
  },
});

export function EnquiryStatusBadge({ status, label }: { status: AdminEnquiryStatus; label: string }) {
  return (
    <span className={badge({ status })}>
      <span aria-hidden="true" className={dot({ status })} />
      {label}
    </span>
  );
}
