"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { AdminDictionary } from "@/content/en-admin";
import { changeErrorText } from "@/lib/admin/change-errors";
import { formatDay, formatDayTime } from "@/lib/admin/dashboard-view";
import { adminHref } from "@/lib/admin/paths";
import { useReleaseReservation } from "@/lib/admin/queries";
import type { ResidenceCard } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";

import { AdminCard } from "./admin-card";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <dt className="text-label text-muted-foreground">{label}</dt>
      <dd className="border-b border-border py-3 text-body text-foreground">{children}</dd>
    </div>
  );
}

export function ReservationCard({ residence, t }: { residence: ResidenceCard; t: AdminDictionary }) {
  const text = t.residence.reservation;
  const release = useReleaseReservation(residence.number);
  const [confirmClient, setConfirmClient] = useState<string | null>(null);
  const [released, setReleased] = useState(false);
  const { reservation } = residence;

  let body;
  if (!reservation) {
    body = (
      <>
        <p className="text-admin-body text-foreground">{text.none}</p>
        <p className="text-admin-caption text-muted-foreground">
          {residence.status === "SOLD" ? text.soldNote : text.fromEnquiry}
        </p>
        {released && (
          <p role="status" className="text-admin-caption text-muted-foreground">
            {text.released}
          </p>
        )}
      </>
    );
  } else {
    const client = reservation.enquiry?.name ?? text.noEnquiry;
    body = (
      <>
        <dl className="flex flex-col gap-5">
          <Field label={text.client}>
            {reservation.enquiry ? (
              <Link href={adminHref.enquiry(reservation.enquiry.id)} className="hover:text-primary">
                {reservation.enquiry.name}
              </Link>
            ) : (
              text.noEnquiry
            )}
          </Field>
          <Field label={text.ends}>
            <time dateTime={reservation.endsAt.toISOString()}>{formatDayTime(reservation.endsAt)}</time>
          </Field>
        </dl>
        <p className="text-admin-caption text-muted-foreground">
          {fillTemplate(text.reservedBy, { author: reservation.createdBy, date: formatDay(reservation.startsAt) })}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => {
            release.reset();
            setConfirmClient(client);
          }}
        >
          {text.release}
        </Button>
      </>
    );
  }

  return (
    <AdminCard id="residence-reservation" title={text.title} lead={text.lead} className="gap-5">
      {body}
      <ConfirmDialog
        open={confirmClient !== null}
        onOpenChange={(open) => !open && setConfirmClient(null)}
        title={fillTemplate(text.releaseTitle, { number: residence.number })}
        confirmLabel={text.releaseConfirm}
        pendingLabel={text.releasing}
        cancelLabel={t.residence.confirm.cancel}
        note={{ label: t.residence.confirm.note, placeholder: t.residence.confirm.notePlaceholder }}
        pending={release.isPending}
        error={changeErrorText(release.error, t.residence)}
        onConfirm={(note) =>
          release.mutate(note || undefined, {
            onSuccess: () => {
              setConfirmClient(null);
              setReleased(true);
            },
          })
        }
      >
        <p>{fillTemplate(text.releaseText, { client: confirmClient ?? "" })}</p>
      </ConfirmDialog>
    </AdminCard>
  );
}
