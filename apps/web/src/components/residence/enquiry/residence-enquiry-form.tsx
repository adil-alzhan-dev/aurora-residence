"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ContactFields, describedBy } from "@/components/enquiry/contact-fields";
import { createEnquirySchema, type EnquiryValues } from "@/components/enquiry/enquiry-schema";
import { errorId, FormField, inputClass } from "@/components/enquiry/form-field";
import { CheckIcon } from "@/components/icons";
import { Button, ButtonArrow } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import { fillTemplate } from "@/lib/format";
import { cn } from "@/lib/utils";

type ResidenceEnquiryFormProps = {
  number: string;
  t: Pick<Dictionary, "enquiry" | "residenceEnquiry">;
};

const ids = { comment: "residence-enquiry-comment", consent: "residence-enquiry-consent" };

/** Same fields and checks as the home form, plus a comment and the consent tick. Sending arrives in task 5b. */
export function ResidenceEnquiryForm({ number, t }: ResidenceEnquiryFormProps) {
  const text = t.residenceEnquiry;
  const errorsText = useMemo(() => ({ ...t.enquiry.errors, ...text.errors }), [t.enquiry.errors, text.errors]);
  const schema = useMemo(() => createEnquirySchema(errorsText, { requireConsent: true }), [errorsText]);
  const [checked, setChecked] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EnquiryValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { name: "", code: "", phone: "", email: "", comment: "", consent: false, website: "" },
  });
  const code = useWatch({ control, name: "code" });

  return (
    <form noValidate onSubmit={handleSubmit(() => setChecked(true))} className="relative flex flex-col gap-6">
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

      <div className="flex flex-col gap-2">
        <label htmlFor={ids.consent} className="flex min-h-11 cursor-pointer items-start gap-3">
          <span className="relative mt-px flex size-5 shrink-0 lg:size-[18px]">
            <input
              id={ids.consent}
              type="checkbox"
              className="peer size-full cursor-pointer appearance-none rounded-base border border-muted-foreground transition-colors duration-200 checked:border-primary checked:bg-primary"
              {...describedBy(ids.consent, Boolean(errors.consent))}
              {...register("consent")}
            />
            <CheckIcon className="pointer-events-none absolute inset-0 m-auto size-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100" />
          </span>
          <span className="text-caption text-muted-foreground">
            {text.consentBefore}
            <span className="text-foreground">{text.privacy}</span>
            {text.consentAfter}
          </span>
        </label>
        {errors.consent && (
          <p id={errorId(ids.consent)} className="text-caption text-destructive">
            {errors.consent.message}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 lg:gap-4">
        <Button type="submit" className="w-full">
          {text.submit}
          <ButtonArrow />
        </Button>
        <p className="text-caption text-muted-foreground">{text.replyNote}</p>
        <p role="status" className="text-body text-foreground empty:hidden">
          {checked ? fillTemplate(text.checked, { number }) : ""}
        </p>
      </div>
    </form>
  );
}
