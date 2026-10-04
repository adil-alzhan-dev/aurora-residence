"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ContactFields } from "@/components/enquiry/contact-fields";
import { createEnquirySchema, type EnquiryValues } from "@/components/enquiry/enquiry-schema";
import { Button, ButtonArrow } from "@/components/ui/button";
import type { Dictionary } from "@/content";

type EnquiryFormProps = {
  t: Dictionary["enquiry"];
};

export function EnquiryForm({ t }: EnquiryFormProps) {
  const schema = useMemo(() => createEnquirySchema(t.errors), [t.errors]);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EnquiryValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { name: "", code: "", phone: "", email: "", website: "" },
  });
  const code = useWatch({ control, name: "code" });

  // POST /api/enquiries still requires a residence number, so the home form stops at validation (task 5b).
  const onSubmit = () => setSubmitted(true);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="relative flex flex-col gap-6 lg:gap-8">
      <h3 className="text-h3 text-foreground">{t.formTitle}</h3>

      <ContactFields idPrefix="enquiry" register={register} errors={errors} code={code} t={t} />

      <div className="flex flex-col gap-4">
        <Button type="submit" className="w-full">
          {t.submit}
          <ButtonArrow />
        </Button>
        <p role="status" className="text-body text-foreground empty:hidden">
          {submitted ? t.notConnected : ""}
        </p>
      </div>
      <p className="text-caption text-muted-foreground">{t.consent}</p>
    </form>
  );
}
