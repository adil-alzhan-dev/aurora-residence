"use client";

import { useState } from "react";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { StatusSelect } from "@/components/admin/status-select";
import type { AdminDictionary } from "@/content/en-admin";
import { changeErrorText } from "@/lib/admin/change-errors";
import { useUpdateResidence } from "@/lib/admin/queries";
import type { AdminResidenceStatus } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";

type ResidenceLike = { number: string; status: AdminResidenceStatus };

/** Leaving Reserved ends the reservation (Available) or closes it as a sale (Sold). */
export function ReservationEffect({
  residence,
  to,
  t,
}: {
  residence: ResidenceLike;
  to: AdminResidenceStatus;
  t: AdminDictionary["residence"]["confirm"];
}) {
  if (residence.status !== "RESERVED" || to === "RESERVED") return null;
  return <p className="text-muted-foreground">{to === "SOLD" ? t.soldNote : t.releaseNote}</p>;
}

/** Status Select in a table row: the change is saved after the manager confirms it. */
export function RowStatusControl({ residence, t }: { residence: ResidenceLike; t: AdminDictionary }) {
  const update = useUpdateResidence(residence.number);
  const [target, setTarget] = useState<AdminResidenceStatus | null>(null);
  const text = t.residence;

  return (
    <>
      <StatusSelect
        value={residence.status}
        current={residence.status}
        onValueChange={(status) => {
          if (status === residence.status) return;
          update.reset();
          setTarget(status);
        }}
        label={fillTemplate(text.priceStatus.statusLabel, { number: residence.number })}
        reservedHint={text.priceStatus.reservedOnlyFromEnquiry}
        statuses={t.facade.statuses}
      />
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title={fillTemplate(text.confirm.title, { number: residence.number })}
        confirmLabel={text.confirm.confirm}
        pendingLabel={text.priceStatus.saving}
        cancelLabel={text.confirm.cancel}
        note={{ label: text.confirm.note, placeholder: text.confirm.notePlaceholder }}
        pending={update.isPending}
        error={changeErrorText(update.error, text, t.messages.api)}
        onConfirm={(note) =>
          target && update.mutate({ status: target, note: note || undefined }, { onSuccess: () => setTarget(null) })
        }
      >
        {target && (
          <>
            <p>
              {fillTemplate(text.confirm.status, {
                from: t.facade.statuses[residence.status],
                to: t.facade.statuses[target],
              })}
            </p>
            <ReservationEffect residence={residence} to={target} t={text.confirm} />
          </>
        )}
      </ConfirmDialog>
    </>
  );
}
