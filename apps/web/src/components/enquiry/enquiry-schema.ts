// zod/mini keeps the enquiry forms light; checks run in the same order as the API DTO.
import * as z from "zod/mini";

const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;
const MAX_PHONE_LENGTH = 25;
const MAX_COMMENT_LENGTH = 2000;

const countDigits = (value: string) => value.replace(/\D/g, "").length;

/** The phone exactly as it goes to the API, so the length check here matches the API's limit of 25. */
export const toFullPhone = (code: string, phone: string) => `${code} ${phone.trim().replace(/\s+/g, " ")}`;

type EnquiryErrors = {
  name: string;
  code: string;
  phone: string;
  email: string;
  comment?: string;
  consent: string;
};

/** Mirrors CreateEnquiryDto in apps/api. */
export function createEnquirySchema(errors: EnquiryErrors) {
  return z
    .object({
      name: z.string().check(z.trim(), z.minLength(2, { error: errors.name }), z.maxLength(80, { error: errors.name })),
      code: z.string().check(z.regex(/^\+\d{1,4}$/, { error: errors.code })),
      phone: z.string().check(z.trim(), z.regex(/^[\d\s()-]+$/, { error: errors.phone })),
      email: z.pipe(
        z.string().check(z.trim(), z.maxLength(254, { error: errors.email })),
        z.email({ error: errors.email }),
      ),
      comment: z.optional(z.string().check(z.trim(), z.maxLength(MAX_COMMENT_LENGTH, { error: errors.comment }))),
      consent: z.optional(z.boolean()).check(z.refine((consent) => consent === true, { error: errors.consent })),
      website: z.optional(z.string().check(z.maxLength(500))),
    })
    .check(
      z.refine(
        ({ code, phone }) => {
          const fullPhone = toFullPhone(code, phone);
          const digits = countDigits(fullPhone);
          return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS && fullPhone.length <= MAX_PHONE_LENGTH;
        },
        { path: ["phone"], error: errors.phone },
      ),
    );
}

export type EnquiryValues = z.input<ReturnType<typeof createEnquirySchema>>;
