"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { UseFormReturn } from "react-hook-form";

import { sendEnquiry, type EnquiryPayload, type EnquirySource } from "@/lib/api/enquiries";

import type { EnquiryValues } from "./enquiry-schema";

/** Shown over the submit button when the request fails as a whole rather than on a field. */
export type FormAlert = { kind: "rate-limited" } | { kind: "failed" } | { kind: "rejected"; message: string };

type Target = { source: EnquirySource; residence?: string };

const FIELDS_WITH_ERRORS = ["name", "phone", "email", "comment", "consent"] as const;

type FieldWithError = (typeof FIELDS_WITH_ERRORS)[number];

const isFieldWithError = (key: string): key is FieldWithError => FIELDS_WITH_ERRORS.some((field) => field === key);

export function toEnquiryPayload(values: EnquiryValues, { source, residence }: Target): EnquiryPayload {
  const comment = values.comment?.trim();
  return {
    name: values.name.trim(),
    phone: `${values.code} ${values.phone.trim()}`,
    email: values.email.trim(),
    ...(comment ? { comment } : {}),
    ...(residence ? { residence } : {}),
    source,
    consent: true,
    website: values.website ?? "",
    locale: "EN",
  };
}

type SubmitCallbacks = {
  onSent: () => void;
  onSendingChange?: (sending: boolean) => void;
};

/**
 * Field errors from the API land on their fields; everything else becomes one alert. The values stay
 * in the form whatever happens.
 */
export function useEnquirySubmit(
  form: UseFormReturn<EnquiryValues>,
  target: Target,
  { onSent, onSendingChange }: SubmitCallbacks,
) {
  const [alert, setAlert] = useState<FormAlert | null>(null);
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  // A response is applied only while its submission is the latest one of a mounted form,
  // so a late answer cannot finish a form the visitor has already left.
  const currentSubmission = useRef(0);

  useEffect(() => {
    const submissions = currentSubmission;
    return () => {
      submissions.current += 1;
    };
  }, []);

  const toggleSending = (next: boolean) => {
    inFlight.current = next;
    setSending(next);
    onSendingChange?.(next);
  };

  const send = async (values: EnquiryValues) => {
    if (inFlight.current) return;
    const submission = ++currentSubmission.current;
    toggleSending(true);
    setAlert(null);
    const result = await sendEnquiry(toEnquiryPayload(values, target));
    if (submission !== currentSubmission.current) return;
    toggleSending(false);
    if (result.kind === "sent") onSent();
    else if (result.kind === "invalid") showFieldErrors(result.fields);
    else setAlert(result);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => form.handleSubmit(send)(event);

  function showFieldErrors(fields: Record<string, string>) {
    const known = Object.entries(fields).filter((entry): entry is [FieldWithError, string] => isFieldWithError(entry[0]));
    if (known.length === 0) {
      setAlert({ kind: "failed" });
      return;
    }
    known.forEach(([field, message], index) => {
      form.setError(field, { type: "server", message }, { shouldFocus: index === 0 });
    });
  }

  return { submit, alert, sending };
}
