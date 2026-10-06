"use client";

import { useId, useState, type FormEvent } from "react";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { StatusSelect } from "@/components/admin/status-select";
import { Button } from "@/components/ui/button";
import type { AdminDictionary } from "@/content/en-admin";
import { changeErrorText, parsePrice } from "@/lib/admin/change-errors";
import { useUpdateResidence, type ResidenceChange } from "@/lib/admin/queries";
import type { ResidenceCard } from "@/lib/admin/schemas";
import { fillTemplate, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

import { AdminCard } from "./admin-card";
import { ReservationEffect } from "./status-change-dialog";

type Props = { residence: ResidenceCard; t: AdminDictionary };

export function PriceStatusCard({ residence, t }: Props) {
  const text = t.residence.priceStatus;
  const priceId = useId();
  const messageId = useId();
  const update = useUpdateResidence(residence.number);

  const server = `${residence.priceUsd}:${residence.status}`;
  const [synced, setSynced] = useState(server);
  const [priceText, setPriceText] = useState(formatUsd(residence.priceUsd));
  const [status, setStatus] = useState(residence.status);
  const [priceError, setPriceError] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [change, setChange] = useState<ResidenceChange | null>(null);
  if (server !== synced) {
    setSynced(server);
    setPriceText(formatUsd(residence.priceUsd));
    setStatus(residence.status);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const price = parsePrice(priceText);
    setPriceError(price === null);
    if (price === null) return;
    const next: ResidenceChange = {};
    if (price !== residence.priceUsd) next.priceUsd = price;
    if (status !== residence.status) next.status = status;
    if (next.priceUsd === undefined && next.status === undefined) {
      setMessage(text.unchanged);
      return;
    }
    setMessage(null);
    update.reset();
    setChange(next);
  }

  function confirm(note: string) {
    if (!change) return;
    update.mutate(
      { ...change, note: note || undefined },
      {
        onSuccess: () => {
          setChange(null);
          setMessage(text.saved);
        },
      },
    );
  }

  function cancel() {
    setPriceText(formatUsd(residence.priceUsd));
    setStatus(residence.status);
    setPriceError(false);
    setMessage(null);
  }

  const confirmText = t.residence.confirm;
  return (
    <AdminCard id="residence-price-status" title={text.title} lead={text.lead} className="gap-6">
      <form noValidate onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor={priceId} className="text-label text-muted-foreground">
              {text.price}
            </label>
            <input
              id={priceId}
              inputMode="numeric"
              autoComplete="off"
              value={priceText}
              aria-invalid={priceError}
              aria-describedby={priceError ? `${priceId}-error` : undefined}
              onChange={(event) => setPriceText(event.target.value)}
              onBlur={() => {
                const price = parsePrice(priceText);
                if (price !== null) setPriceText(formatUsd(price));
              }}
              className={cn(
                "border-b bg-transparent py-3 text-body text-foreground outline-none transition-colors duration-200 hover:border-foreground focus:border-primary",
                priceError ? "border-destructive" : "border-border",
              )}
            />
            {priceError && (
              <p id={`${priceId}-error`} className="text-admin-caption text-destructive">
                {text.priceInvalid}
              </p>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <span aria-hidden="true" className="text-label text-muted-foreground">
              {text.status}
            </span>
            <StatusSelect
              value={status}
              current={residence.status}
              onValueChange={setStatus}
              label={fillTemplate(text.statusLabel, { number: residence.number })}
              reservedHint={text.reservedOnlyFromEnquiry}
              statuses={t.facade.statuses}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" aria-describedby={message ? messageId : undefined}>
            {text.save}
          </Button>
          <Button type="button" variant="ghost" className="px-3" onClick={cancel}>
            {text.cancel}
          </Button>
        </div>
        <p id={messageId} role="status" className="text-admin-caption text-muted-foreground empty:hidden">
          {message}
        </p>
      </form>
      <ConfirmDialog
        open={change !== null}
        onOpenChange={(open) => !open && setChange(null)}
        title={fillTemplate(confirmText.title, { number: residence.number })}
        confirmLabel={confirmText.confirm}
        pendingLabel={text.saving}
        cancelLabel={confirmText.cancel}
        note={{ label: confirmText.note, placeholder: confirmText.notePlaceholder }}
        pending={update.isPending}
        error={changeErrorText(update.error, t.residence)}
        onConfirm={confirm}
      >
        {change?.priceUsd !== undefined && (
          <p>
            {fillTemplate(confirmText.price, { from: formatUsd(residence.priceUsd), to: formatUsd(change.priceUsd) })}
          </p>
        )}
        {change?.status && (
          <>
            <p>
              {fillTemplate(confirmText.status, {
                from: t.facade.statuses[residence.status],
                to: t.facade.statuses[change.status],
              })}
            </p>
            <ReservationEffect residence={residence} to={change.status} t={confirmText} />
          </>
        )}
      </ConfirmDialog>
    </AdminCard>
  );
}
