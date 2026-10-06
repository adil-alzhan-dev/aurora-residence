"use client";

import { useState } from "react";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button, ButtonArrow } from "@/components/ui/button";
import type { AdminDictionary } from "@/content/en-admin";
import { formatDayTime } from "@/lib/admin/dashboard-view";
import { reserveErrorText } from "@/lib/admin/enquiry-errors";
import { useReserveResidence } from "@/lib/admin/enquiry-queries";
import { reservationEnd, reserveState } from "@/lib/admin/reservation-rules";
import type { EnquiryCard } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";

/** "Reserve for 7 days" when the residence is free, otherwise a plain reason why not. */
export function EnquiryReserve({ enquiry, t }: { enquiry: EnquiryCard; t: AdminDictionary["enquiry"] }) {
  const reserve = useReserveResidence();
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const state = reserveState(enquiry);
  const number = enquiry.residence?.number ?? "";
  const text = t.residence;

  if (state.kind === "general") return null;
  if (state.kind !== "can-reserve") {
    const reason = {
      "reserved-here": fillTemplate(text.reservedHere, { date: state.kind === "reserved-here" ? formatDayTime(state.endsAt) : "" }),
      "reserved-else": fillTemplate(text.reservedElse, { number }),
      sold: fillTemplate(text.sold, { number }),
      closed: text.closed,
    }[state.kind];
    return (
      <p role="status" className="border-l-2 border-border pl-4 text-admin-body text-foreground">
        {reason}
      </p>
    );
  }

  return (
    <>
      <Button
        type="button"
        className="w-full"
        onClick={() => {
          reserve.reset();
          setEndsAt(reservationEnd(new Date()));
        }}
      >
        {text.reserve}
        <ButtonArrow />
      </Button>
      <p className="text-admin-caption text-muted-foreground">{fillTemplate(text.reserveHint, { number })}</p>
      <ConfirmDialog
        open={endsAt !== null}
        onOpenChange={(open) => !open && setEndsAt(null)}
        title={fillTemplate(text.confirmTitle, { number, client: enquiry.name })}
        confirmLabel={text.reserve}
        pendingLabel={text.reserving}
        cancelLabel={t.cancel}
        pending={reserve.isPending}
        error={reserveErrorText(reserve.error, number, t.errors)}
        onConfirm={() => reserve.mutate({ number, enquiryId: enquiry.id }, { onSuccess: () => setEndsAt(null) })}
      >
        <p>{fillTemplate(text.confirmText, { date: endsAt ? formatDayTime(endsAt) : "" })}</p>
        {enquiry.status === "NEW" && <p className="text-muted-foreground">{text.confirmStatus}</p>}
      </ConfirmDialog>
    </>
  );
}
