"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ConsentField } from "@/components/enquiry/consent-field";
import { ContactFields } from "@/components/enquiry/contact-fields";
import type { EnquiryValues } from "@/components/enquiry/enquiry-schema";
import { FormAlertMessage, SubmitButton } from "@/components/enquiry/form-status";
import { lazyEnquiryResolver } from "@/components/enquiry/lazy-enquiry-resolver";
import { useEnquirySubmit } from "@/components/enquiry/use-enquiry-submit";
import type { Dictionary } from "@/content";

type EnquiryFormProps = {
  t: Pick<Dictionary, "enquiry" | "enquirySend" | "contacts" | "locale">;
  onSent: () => void;
};

export function EnquiryForm({ t, onSent }: EnquiryFormProps) {
  const { enquiry, enquirySend } = t;
  const messages = useMemo(
    () => ({ ...enquiry.errors, consent: enquirySend.consentError }),
    [enquiry.errors, enquirySend.consentError],
  );
  const resolver = useMemo(() => lazyEnquiryResolver(messages), [messages]);
  const form = useForm<EnquiryValues>({
    resolver,
    mode: "onTouched",
    defaultValues: { name: "", code: "", phone: "", email: "", consent: false, website: "" },
  });
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const code = useWatch({ control, name: "code" });
  const { submit, alert, sending } = useEnquirySubmit(
    form,
    { source: "Contacts form", locale: t.locale.lang },
    { onSent, messages },
  );

  return (
    <form noValidate onSubmit={submit} className="relative flex flex-col gap-6 lg:gap-8">
      <h3 className="text-h3 text-foreground">{enquiry.formTitle}</h3>

      <ContactFields idPrefix="enquiry" register={register} errors={errors} code={code} t={enquiry} />

      <ConsentField id="enquiry-consent" register={register} errors={errors} t={enquirySend} />

      <div className="flex flex-col gap-4">
        {alert && <FormAlertMessage alert={alert} phone={t.contacts.phone} t={enquirySend} />}
        <SubmitButton sending={sending} label={enquiry.submit} sendingLabel={enquirySend.sending} />
      </div>
    </form>
  );
}
