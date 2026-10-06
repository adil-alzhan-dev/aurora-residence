"use client";

import { useId, useState } from "react";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ChevronDownIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { AdminDictionary } from "@/content/en-admin";
import { formatDayTime, formatReceived } from "@/lib/admin/dashboard-view";
import { reserveErrorText } from "@/lib/admin/enquiry-errors";
import { useReserveResidence } from "@/lib/admin/enquiry-queries";
import { useResidenceEnquiries } from "@/lib/admin/queries";
import { reservableEnquiries, reservationEnd } from "@/lib/admin/reservation-rules";
import type { ResidenceCard } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";

type ReserveProps = { residence: ResidenceCard; now: Date; t: AdminDictionary };

/** The residence card reserves for one of its open enquiries, as on the enquiry card. */
export function ReserveFromEnquiry({ residence, now, t }: ReserveProps) {
  const text = t.residence.reservation;
  const selectId = useId();
  const { data, isError } = useResidenceEnquiries(residence.number);
  const reserve = useReserveResidence();
  const [chosen, setChosen] = useState<number | null>(null);
  const [confirmAt, setConfirmAt] = useState<Date | null>(null);
  const options = reservableEnquiries(data?.items ?? [], residence.number, residence.status);
  const enquiry = options.find((item) => item.id === chosen) ?? options[0];

  if (isError && !data) return <p className="text-admin-body text-muted-foreground">{t.residence.enquiries.failed}</p>;
  if (!data) return <div aria-hidden="true" className="h-40 animate-pulse bg-background" />;
  if (!enquiry) {
    return (
      <p className="text-admin-body text-muted-foreground">
        {fillTemplate(text.noOpenEnquiries, { number: residence.number })}
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={selectId} className="text-label text-muted-foreground">
            {text.enquiryLabel}
          </label>
          <div className="relative border-b border-border focus-within:border-primary">
            <select
              id={selectId}
              value={enquiry.id}
              onChange={(event) => setChosen(Number(event.target.value))}
              className="w-full cursor-pointer appearance-none bg-transparent py-3 pr-8 text-body text-foreground outline-none"
            >
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {fillTemplate(text.enquiryOption, { name: item.name, received: formatReceived(item.createdAt, now, t.enquiries) })}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-foreground" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-label text-muted-foreground">{text.ends}</span>
          <span className="border-b border-border py-3 text-body text-foreground">
            {formatDayTime(reservationEnd(now))}
          </span>
        </div>
      </div>
      <p className="text-admin-caption text-muted-foreground">{text.endsHint}</p>
      <Button
        type="button"
        className="w-full"
        onClick={() => {
          reserve.reset();
          setConfirmAt(reservationEnd(new Date()));
        }}
      >
        {text.reserve}
      </Button>
      <p className="text-admin-caption text-muted-foreground">{text.reserveNote}</p>
      <ConfirmDialog
        open={confirmAt !== null}
        onOpenChange={(open) => !open && setConfirmAt(null)}
        title={fillTemplate(text.reserveTitle, { number: residence.number, client: enquiry.name })}
        confirmLabel={text.reserve}
        pendingLabel={text.reserving}
        cancelLabel={t.residence.confirm.cancel}
        pending={reserve.isPending}
        error={reserveErrorText(reserve.error, residence.number, t.enquiry.errors)}
        onConfirm={() =>
          reserve.mutate({ number: residence.number, enquiryId: enquiry.id }, { onSuccess: () => setConfirmAt(null) })
        }
      >
        <p>{fillTemplate(text.reserveText, { date: confirmAt ? formatDayTime(confirmAt) : "" })}</p>
        {enquiry.status === "NEW" && <p className="text-muted-foreground">{text.reserveStatus}</p>}
      </ConfirmDialog>
    </>
  );
}
