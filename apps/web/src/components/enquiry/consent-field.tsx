import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { CheckIcon } from "@/components/icons";
import type { Dictionary } from "@/content";

import { describedBy } from "./contact-fields";
import type { EnquiryValues } from "./enquiry-schema";
import { errorId } from "./form-field";

type ConsentFieldProps = {
  id: string;
  register: UseFormRegister<EnquiryValues>;
  errors: FieldErrors<EnquiryValues>;
  t: Dictionary["enquirySend"];
};

/** The API accepts an enquiry only with an explicit tick, so it starts unchecked in every form. */
export function ConsentField({ id, register, errors, t }: ConsentFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3">
        <span className="relative mt-px flex size-5 shrink-0 lg:size-[18px]">
          <input
            id={id}
            type="checkbox"
            className="peer size-full cursor-pointer appearance-none rounded-base border border-muted-foreground transition-colors duration-200 checked:border-primary checked:bg-primary"
            {...describedBy(id, Boolean(errors.consent))}
            {...register("consent")}
          />
          <CheckIcon className="pointer-events-none absolute inset-0 m-auto size-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100" />
        </span>
        <span className="text-caption text-muted-foreground">
          {t.consentBefore}
          <span className="text-foreground">{t.privacy}</span>
          {t.consentAfter}
        </span>
      </label>
      {errors.consent && (
        <p id={errorId(id)} className="text-caption text-destructive">
          {errors.consent.message}
        </p>
      )}
    </div>
  );
}
