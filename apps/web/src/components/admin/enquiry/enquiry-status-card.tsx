"use client";

import { AdminCard } from "@/components/admin/residence/admin-card";
import type { AdminDictionary } from "@/content/en-admin";
import { ENQUIRY_STATUSES } from "@/lib/admin/enquiry-filters";
import { enquiryChangeErrorText } from "@/lib/admin/enquiry-errors";
import { useUpdateEnquiry } from "@/lib/admin/enquiry-queries";
import type { EnquiryCard } from "@/lib/admin/schemas";
import { cn } from "@/lib/utils";

/** The status switch saves at once: it never touches the residence or a reservation. */
export function EnquiryStatusCard({ enquiry, t }: { enquiry: EnquiryCard; t: AdminDictionary }) {
  const update = useUpdateEnquiry(enquiry.id);
  const text = t.enquiry.status;
  const pendingStatus = update.isPending ? update.variables?.status : undefined;
  const shown = pendingStatus ?? enquiry.status;
  const error = enquiryChangeErrorText(update.error, t.enquiry.errors);

  return (
    <AdminCard id="enquiry-status" title={text.title} className="gap-4">
      <div role="group" aria-label={text.label} className="flex rounded-base border border-border bg-card">
        {ENQUIRY_STATUSES.map((status) => {
          const active = shown === status;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              disabled={update.isPending}
              onClick={() => status !== enquiry.status && update.mutate({ status })}
              className={cn(
                "flex h-10 min-w-0 flex-1 items-center justify-center px-2 whitespace-nowrap transition-colors duration-200 sm:px-3 focus-visible:-outline-offset-2",
                active ? "bg-foreground text-admin-strong text-card" : "text-admin-body text-muted-foreground hover:text-foreground",
                update.isPending && "cursor-wait",
              )}
            >
              {t.enquiries.statuses[status]}
            </button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-admin-body text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-admin-caption text-muted-foreground">{text.hint}</p>
      )}
    </AdminCard>
  );
}
