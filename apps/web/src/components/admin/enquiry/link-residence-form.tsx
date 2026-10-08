"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { AdminDictionary } from "@/content/en-admin";
import { linkErrorText } from "@/lib/admin/enquiry-errors";
import { isResidenceNumber } from "@/lib/admin/enquiry-filters";
import { useUpdateEnquiry } from "@/lib/admin/enquiry-queries";
import { useAdminResidences } from "@/lib/admin/queries";
import { fillTemplate } from "@/lib/format";

const NO_FILTERS = { search: "", floor: null };

/** Suggests residences that can still be linked; a sold one would be refused by the API. */
function useLinkableNumbers() {
  const { data } = useAdminResidences(NO_FILTERS);
  return useMemo(
    () =>
      (data?.items ?? [])
        .filter((item) => item.status !== "SOLD")
        .sort((a, b) => a.floor - b.floor || a.position - b.position)
        .map((item) => item.number),
    [data],
  );
}

type LinkResidenceFormProps = {
  enquiryId: number;
  t: AdminDictionary["enquiry"];
  api: AdminDictionary["messages"]["api"];
};

export function LinkResidenceForm({ enquiryId, t, api }: LinkResidenceFormProps) {
  const text = t.link;
  const inputId = useId();
  const listId = useId();
  const errorId = useId();
  const numbers = useLinkableNumbers();
  const update = useUpdateEnquiry(enquiryId);
  const [pending, setPending] = useState<string | null>(null);
  const schema = z.object({
    number: z.string().trim().refine(isResidenceNumber, text.invalid),
  });
  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { number: "" },
  });
  const fieldError = form.formState.errors.number?.message;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(({ number }) => {
        update.reset();
        setPending(number);
      })}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-label text-muted-foreground">
          {text.label}
        </label>
        <input
          id={inputId}
          list={listId}
          inputMode="decimal"
          autoComplete="off"
          maxLength={5}
          placeholder={text.placeholder}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? errorId : undefined}
          {...form.register("number")}
          className="border-b border-border bg-transparent py-3 text-body text-foreground outline-none placeholder:text-muted-foreground focus:border-primary aria-invalid:border-destructive"
        />
        <datalist id={listId}>
          {numbers.map((number) => (
            <option key={number} value={number} />
          ))}
        </datalist>
        {fieldError && (
          <p id={errorId} role="alert" className="text-admin-body text-destructive">
            {fieldError}
          </p>
        )}
      </div>
      <Button type="submit" variant="secondary" className="w-full">
        {text.submit}
      </Button>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending ? fillTemplate(text.confirmTitle, { number: pending }) : ""}
        confirmLabel={text.confirm}
        pendingLabel={text.linking}
        cancelLabel={t.cancel}
        pending={update.isPending}
        error={pending ? linkErrorText(update.error, pending, { ...t.errors, invalid: text.invalid }, api) : null}
        onConfirm={() => pending && update.mutate({ residenceNumber: pending }, { onSuccess: () => setPending(null) })}
      >
        <p>{pending ? fillTemplate(text.confirmText, { number: pending }) : ""}</p>
      </ConfirmDialog>
    </form>
  );
}
