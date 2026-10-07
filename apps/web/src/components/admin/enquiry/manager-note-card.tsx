"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAdminFormat } from "@/components/admin/admin-locale";
import { AdminCard } from "@/components/admin/residence/admin-card";
import { Button } from "@/components/ui/button";
import type { AdminDictionary } from "@/content/en-admin";
import { enquiryChangeErrorText } from "@/lib/admin/enquiry-errors";
import { useUpdateEnquiry } from "@/lib/admin/enquiry-queries";
import { lastNoteSave, receivedWhen } from "@/lib/admin/enquiry-view";
import type { EnquiryCard } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";

const NOTE_MAX = 2000;

type NoteCardProps = { enquiry: EnquiryCard; now: Date; t: AdminDictionary["enquiry"] };

export function ManagerNoteCard({ enquiry, now, t }: NoteCardProps) {
  const text = t.note;
  const fieldId = useId();
  const errorId = useId();
  const update = useUpdateEnquiry(enquiry.id);
  const format = useAdminFormat();
  const [saved, setSaved] = useState(false);
  const schema = z.object({ note: z.string().max(NOTE_MAX, text.tooLong) });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    values: { note: enquiry.managerNote ?? "" },
    resetOptions: { keepDirtyValues: true },
  });
  const fieldError = form.formState.errors.note?.message;
  const requestError = enquiryChangeErrorText(update.error, t.errors);
  const lastSave = enquiry.managerNote ? lastNoteSave(enquiry.activity) : null;

  const submit = form.handleSubmit(({ note }) => {
    setSaved(false);
    update.mutate(
      { managerNote: note.trim() },
      {
        onSuccess: (card) => {
          form.reset({ note: card.managerNote ?? "" });
          setSaved(true);
        },
      },
    );
  });

  return (
    <AdminCard id="enquiry-note" title={text.title} lead={text.lead} className="gap-3">
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <label htmlFor={fieldId} className="sr-only">
          {text.label}
        </label>
        <textarea
          id={fieldId}
          rows={4}
          maxLength={NOTE_MAX}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? errorId : undefined}
          {...form.register("note", { onChange: () => setSaved(false) })}
          className="min-h-28 w-full resize-y rounded-base border border-border bg-background px-4 py-3 text-admin-body text-foreground outline-none focus:border-primary"
        />
        {(fieldError || requestError) && (
          <p id={errorId} role="alert" className="text-admin-body text-destructive">
            {fieldError ?? requestError}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="text-admin-caption text-muted-foreground">
            {saved
              ? text.saved
              : lastSave
                ? fillTemplate(text.lastSaved, { when: receivedWhen(lastSave.at, now, t, format), author: lastSave.author })
                : text.never}
          </p>
          <Button type="submit" variant="secondary" disabled={update.isPending}>
            {update.isPending ? text.saving : text.save}
          </Button>
        </div>
      </form>
    </AdminCard>
  );
}
