"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { EnquiryPayload, EnquiryResult, EnquirySource } from "@/lib/api/enquiries";
import type { Locale } from "@/lib/locale";

import type { EnquiryValues } from "./enquiry-schema";
import { toFullPhone } from "./full-phone";

export type FormAlert = Extract<EnquiryResult, { kind: "refused" | "failed" }>;

type Target = { source: EnquirySource; residence?: string; locale: Locale };

const FIELDS_WITH_ERRORS = ["name", "phone", "email", "comment", "consent"] as const;

type FieldWithError = (typeof FIELDS_WITH_ERRORS)[number];

const isFieldWithError = (key: string): key is FieldWithError => FIELDS_WITH_ERRORS.some((field) => field === key);

export function toEnquiryPayload(values: EnquiryValues, { source, residence, locale }: Target): EnquiryPayload {
  const comment = values.comment?.trim();
  return {
    name: values.name.trim(),
    phone: toFullPhone(values.code, values.phone),
    email: values.email.trim(),
    ...(comment ? { comment } : {}),
    ...(residence ? { residence } : {}),
    source,
    consent: true,
    website: values.website ?? "",
    locale: locale === "ru" ? "RU" : "EN",
  };
}

type SubmitOptions = {
  onSent: () => void;
  onSendingChange?: (sending: boolean) => void;
  /** The form's own texts for API field errors; the API's English words are never shown. */
  messages?: Partial<Record<FieldWithError, string>>;
};

export function useEnquirySubmit(
  form: UseFormReturn<EnquiryValues>,
  target: Target,
  { onSent, onSendingChange, messages = {} }: SubmitOptions,
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
    // The request module (and its response schema) is fetched with the first send.
    const { sendEnquiry } = await import("@/lib/api/enquiries");
    const result = await sendEnquiry(toEnquiryPayload(values, target));
    if (submission !== currentSubmission.current) return;
    toggleSending(false);
    if (result.kind === "sent") onSent();
    else if (result.kind === "invalid") showFieldErrors(result.fields);
    else setAlert(result);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => form.handleSubmit(send)(event);

  function showFieldErrors(fields: Record<string, string>) {
    const known = Object.keys(fields).filter(isFieldWithError).filter((field) => messages[field]);
    if (known.length === 0) {
      setAlert({ kind: "failed" });
      return;
    }
    known.forEach((field, index) => {
      form.setError(field, { type: "server", message: messages[field] }, { shouldFocus: index === 0 });
    });
  }

  return { submit, alert, sending };
}
