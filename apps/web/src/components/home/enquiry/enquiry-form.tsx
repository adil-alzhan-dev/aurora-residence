"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ChevronDownIcon } from "@/components/icons";
import { Button, ButtonArrow } from "@/components/ui/button";
import type { Dictionary } from "@/content";

import { createEnquirySchema, type EnquiryValues } from "./enquiry-schema";
import { errorId, FormField, inputClass } from "./form-field";

type EnquiryFormProps = {
  t: Dictionary["enquiry"];
};

const ids = { name: "enquiry-name", phone: "enquiry-phone", email: "enquiry-email", website: "enquiry-website" };

const describedBy = (id: string, hasError: boolean) => ({
  "aria-invalid": hasError || undefined,
  "aria-describedby": hasError ? errorId(id) : undefined,
});

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
  const phoneError = errors.code?.message ?? errors.phone?.message;

  // POST /api/enquiries still requires a residence number, so the home form stops at validation (task 5).
  const onSubmit = () => setSubmitted(true);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="relative flex flex-col gap-6 lg:gap-8">
      <h3 className="text-h3 text-foreground">{t.formTitle}</h3>

      <FormField id={ids.name} label={t.name} error={errors.name?.message}>
        <input
          id={ids.name}
          type="text"
          autoComplete="name"
          placeholder={t.namePlaceholder}
          className={inputClass}
          {...describedBy(ids.name, Boolean(errors.name))}
          {...register("name")}
        />
      </FormField>

      <FormField id={ids.phone} label={t.phone} error={phoneError}>
        <span className="relative flex shrink-0 items-center gap-1">
          <span aria-hidden="true" className="font-sans text-base leading-[1.625rem] text-foreground">
            {code || t.codePlaceholder}
          </span>
          <ChevronDownIcon aria-hidden="true" className="text-muted-foreground" />
          <select
            aria-label={t.countryCode}
            autoComplete="tel-country-code"
            className="absolute inset-0 cursor-pointer opacity-0"
            {...describedBy(ids.phone, Boolean(errors.code))}
            {...register("code")}
          >
            <option value="" disabled>
              {t.codePlaceholder}
            </option>
            {t.countries.map(([dialCode, country]) => (
              <option key={dialCode} value={dialCode}>
                {dialCode} {country}
              </option>
            ))}
          </select>
        </span>
        <span aria-hidden="true" className="h-4 w-px shrink-0 bg-border" />
        <input
          id={ids.phone}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={t.phoneNumber}
          className={inputClass}
          {...describedBy(ids.phone, Boolean(errors.phone))}
          {...register("phone")}
        />
      </FormField>

      <FormField id={ids.email} label={t.email} error={errors.email?.message}>
        <input
          id={ids.email}
          type="email"
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          className={inputClass}
          {...describedBy(ids.email, Boolean(errors.email))}
          {...register("email")}
        />
      </FormField>

      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor={ids.website}>{t.website}</label>
        <input id={ids.website} type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

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
