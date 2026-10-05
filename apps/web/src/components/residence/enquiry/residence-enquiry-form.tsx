"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ConsentField } from "@/components/enquiry/consent-field";
import { ContactFields, describedBy } from "@/components/enquiry/contact-fields";
import { createEnquirySchema, type EnquiryValues } from "@/components/enquiry/enquiry-schema";
import { FormField, inputClass } from "@/components/enquiry/form-field";
import { FormAlertMessage, SubmitButton } from "@/components/enquiry/form-status";
import { useEnquirySubmit } from "@/components/enquiry/use-enquiry-submit";
import type { Dictionary } from "@/content";
import { cn } from "@/lib/utils";

type ResidenceEnquiryFormProps = {
  number: string;
  t: Pick<Dictionary, "enquiry" | "residenceEnquiry" | "enquirySend" | "contacts">;
  onSent: () => void;
  onSendingChange: (sending: boolean) => void;
};

const ids = { comment: "residence-enquiry-comment", consent: "residence-enquiry-consent" };

/** Same fields and checks as the home form, plus a comment; sent with the residence number. */
export function ResidenceEnquiryForm({ number, t, onSent, onSendingChange }: ResidenceEnquiryFormProps) {
  const text = t.residenceEnquiry;
  const schema = useMemo(
    () => createEnquirySchema({ ...t.enquiry.errors, ...text.errors, consent: t.enquirySend.consentError }),
    [t.enquiry.errors, text.errors, t.enquirySend.consentError],
  );
  const form = useForm<EnquiryValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { name: "", code: "", phone: "", email: "", comment: "", consent: false, website: "" },
  });
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const code = useWatch({ control, name: "code" });
  const { submit, alert, sending } = useEnquirySubmit(
    form,
    { source: "Residence page", residence: number },
    { onSent, onSendingChange },
  );

  return (
    <form noValidate onSubmit={submit} className="relative flex flex-col gap-6">
      <ContactFields
        idPrefix="residence-enquiry"
        register={register}
        errors={errors}
        code={code}
        t={t.enquiry}
        labels={{ name: text.nameLabel, emailPlaceholder: text.emailPlaceholder }}
      />

      <FormField id={ids.comment} label={text.comment} error={errors.comment?.message}>
        <textarea
          id={ids.comment}
          rows={1}
          placeholder={text.commentPlaceholder}
          className={cn(inputClass, "field-sizing-content max-h-40 resize-none")}
          {...describedBy(ids.comment, Boolean(errors.comment))}
          {...register("comment")}
        />
      </FormField>

      <ConsentField id={ids.consent} register={register} errors={errors} t={t.enquirySend} />

      <div className="flex flex-col items-center gap-3 lg:gap-4">
        {alert && <FormAlertMessage alert={alert} phone={t.contacts.phone} t={t.enquirySend} />}
        <SubmitButton sending={sending} label={text.submit} sendingLabel={t.enquirySend.sending} />
        <p className="text-caption text-muted-foreground">{text.replyNote}</p>
      </div>
    </form>
  );
}
