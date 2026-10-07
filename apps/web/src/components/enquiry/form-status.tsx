"use client";

import { useEffect, useRef } from "react";

import { Button, ButtonArrow } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import { contactLinks } from "@/content/navigation";

import type { FormAlert } from "./use-enquiry-submit";

type FormAlertMessageProps = {
  alert: FormAlert;
  phone: string;
  t: Dictionary["enquirySend"];
};

export const inlineLinkClass = "text-foreground underline underline-offset-4 transition-colors duration-200 hover:text-primary";

/** Mounted afresh for every failure, so it takes focus and is announced each time. */
export function FormAlertMessage({ alert, phone, t }: FormAlertMessageProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <p ref={ref} role="alert" tabIndex={-1} className="w-full text-caption text-destructive outline-none">
      {alert.kind === "rate-limited" && t.rateLimited}
      {alert.kind === "rejected" && t.soldRejected}
      {alert.kind === "failed" && (
        <>
          {t.failedBefore}
          <a href={contactLinks.phone} className={inlineLinkClass}>
            {phone}
          </a>
          {t.failedAfter}
        </>
      )}
    </p>
  );
}

type SubmitButtonProps = {
  sending: boolean;
  label: string;
  sendingLabel: string;
};

/** Stays focusable while sending (aria-disabled rather than disabled), so focus is not lost mid-request. */
export function SubmitButton({ sending, label, sendingLabel }: SubmitButtonProps) {
  return (
    <Button type="submit" className="w-full" aria-disabled={sending || undefined} aria-busy={sending || undefined}>
      {sending ? (
        <>
          {sendingLabel}
          <span
            aria-hidden="true"
            className="size-4 shrink-0 animate-spin rounded-full border border-current border-r-transparent motion-reduce:animate-none"
          />
        </>
      ) : (
        <>
          {label}
          <ButtonArrow />
        </>
      )}
    </Button>
  );
}
