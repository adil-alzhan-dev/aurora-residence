"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useId, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  cancelLabel: string;
  note?: { label: string; placeholder: string };
  pending: boolean;
  error: string | null;
  onConfirm: (note: string) => void;
};

/** Every change that reaches the site is confirmed first; the note goes into the residence history. */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const { open, onOpenChange, title, children, confirmLabel, pendingLabel, cancelLabel, note, pending, error } = props;
  const noteId = useId();
  const [text, setText] = useState("");

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) setText("");
        onOpenChange(next);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-dark/60" />
        <AlertDialog.Content
          className={cn(
            "fixed z-50 flex flex-col gap-5 border-border bg-card text-foreground",
            "max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[90svh] max-md:overflow-y-auto max-md:border-t max-md:px-4 max-md:pt-6 max-md:pb-[max(1rem,env(safe-area-inset-bottom))]",
            "md:top-1/2 md:left-1/2 md:w-[calc(100vw-2rem)] md:max-w-[480px] md:-translate-1/2 md:rounded-base md:border md:p-6",
          )}
        >
          <AlertDialog.Title className="text-admin-section text-foreground">{title}</AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="flex flex-col gap-1 text-admin-body text-foreground">{children}</div>
          </AlertDialog.Description>
          {note && (
            <div className="flex flex-col gap-2">
              <label htmlFor={noteId} className="text-label text-muted-foreground">
                {note.label}
              </label>
              <input
                id={noteId}
                value={text}
                maxLength={300}
                placeholder={note.placeholder}
                onChange={(event) => setText(event.target.value)}
                className="border-b border-border bg-transparent py-3 text-body text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          )}
          {error && (
            <p role="alert" className="text-admin-body text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 max-md:mt-auto max-md:flex-col max-md:items-stretch max-md:gap-1">
            <Button type="button" disabled={pending} onClick={() => props.onConfirm(text.trim())}>
              {pending ? pendingLabel : confirmLabel}
            </Button>
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="ghost" disabled={pending} className="px-3 max-md:w-full">
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
