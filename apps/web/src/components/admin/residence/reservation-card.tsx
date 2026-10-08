"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { useAdminFormat } from "@/components/admin/admin-locale";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { AdminDictionary } from "@/content/en-admin";
import { changeErrorText } from "@/lib/admin/change-errors";
import { authorText } from "@/lib/admin/api-texts";
import { reserveErrorText } from "@/lib/admin/enquiry-errors";
import { useReserveResidence } from "@/lib/admin/enquiry-queries";
import { adminHref } from "@/lib/admin/paths";
import { useReleaseReservation } from "@/lib/admin/queries";
import type { ResidenceCard } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";

import { AdminCard } from "./admin-card";
import { ReserveFromEnquiry } from "./reserve-from-enquiry";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <dt className="text-label text-muted-foreground">{label}</dt>
      <dd className="border-b border-border py-3 text-body text-foreground">{children}</dd>
    </div>
  );
}

type ReservationCardProps = { residence: ResidenceCard; now: Date; t: AdminDictionary };

export function ReservationCard({ residence, now, t }: ReservationCardProps) {
  const text = t.residence.reservation;
  const release = useReleaseReservation(residence.number);
  const format = useAdminFormat();
  const reserve = useReserveResidence();
  const reserveError = reserveErrorText(reserve.error, residence.number, t.enquiry.errors, t.messages.api);
  const [confirmClient, setConfirmClient] = useState<string | null>(null);
  const [released, setReleased] = useState(false);
  const { reservation } = residence;

  let body;
  if (!reservation) {
    body = (
      <>
        {residence.status === "AVAILABLE" ? (
          <ReserveFromEnquiry residence={residence} reserve={reserve} now={now} t={t} />
        ) : (
          <>
            <p className="text-admin-body text-foreground">{text.none}</p>
            {residence.status === "SOLD" && <p className="text-admin-caption text-muted-foreground">{text.soldNote}</p>}
          </>
        )}
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
              <Link href={adminHref.enquiry(reservation.enquiry.id)} className="hover:text-primary max-md:inline-flex max-md:min-h-11 max-md:items-center">
                {reservation.enquiry.name}
              </Link>
            ) : (
              text.noEnquiry
            )}
          </Field>
          <Field label={text.ends}>
            <time dateTime={reservation.endsAt.toISOString()}>{format.dayTime(reservation.endsAt)}</time>
          </Field>
        </dl>
        <p className="text-admin-caption text-muted-foreground">
          {fillTemplate(text.reservedBy, { author: authorText(reservation.createdBy, t.messages), date: format.day(reservation.startsAt) })}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => {
            release.reset();
            reserve.reset();
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
      {reserveError && (
        <p role="alert" className="text-admin-body text-destructive">
          {reserveError}
        </p>
      )}
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
        error={changeErrorText(release.error, residence.number, t.residence, t.messages.api)}
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
