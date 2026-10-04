import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { ChevronDownIcon } from "@/components/icons";
import type { Dictionary } from "@/content";

import type { EnquiryValues } from "./enquiry-schema";
import { errorId, FormField, inputClass } from "./form-field";

type ContactFieldsProps = {
  idPrefix: string;
  register: UseFormRegister<EnquiryValues>;
  errors: FieldErrors<EnquiryValues>;
  /** Selected country code, shown over the invisible native select. */
  code: string | undefined;
  t: Dictionary["enquiry"];
  labels?: { name?: string; emailPlaceholder?: string };
};

export const describedBy = (id: string, hasError: boolean) => ({
  "aria-invalid": hasError || undefined,
  "aria-describedby": hasError ? errorId(id) : undefined,
});

/** Name, phone with country code, email and the hidden honeypot: the same fields in every enquiry form. */
export function ContactFields({ idPrefix, register, errors, code, t, labels }: ContactFieldsProps) {
  const ids = {
    name: `${idPrefix}-name`,
    phone: `${idPrefix}-phone`,
    email: `${idPrefix}-email`,
    website: `${idPrefix}-website`,
  };
  const phoneError = errors.code?.message ?? errors.phone?.message;

  return (
    <>
      <FormField id={ids.name} label={labels?.name ?? t.name} error={errors.name?.message}>
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
          placeholder={labels?.emailPlaceholder ?? t.emailPlaceholder}
          className={inputClass}
          {...describedBy(ids.email, Boolean(errors.email))}
          {...register("email")}
        />
      </FormField>

      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor={ids.website}>{t.website}</label>
        <input id={ids.website} type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
    </>
  );
}
