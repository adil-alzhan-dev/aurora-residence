import { z } from "zod";

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

/**
 * Mirrors CreateEnquiryDto in apps/api: the phone is checked as the full "+code number" string,
 * up to 25 characters with 7-15 digits.
 */
export function createEnquirySchema(errors: EnquiryErrors) {
  return z
    .object({
      name: z.string().trim().min(2, { error: errors.name }).max(80, { error: errors.name }),
      code: z.string().regex(/^\+\d{1,4}$/, { error: errors.code }),
      phone: z
        .string()
        .trim()
        .regex(/^[\d\s()-]+$/, { error: errors.phone }),
      email: z.string().trim().max(254, { error: errors.email }).pipe(z.email({ error: errors.email })),
      comment: z.string().trim().max(MAX_COMMENT_LENGTH, { error: errors.comment }).optional(),
      consent: z
        .boolean()
        .optional()
        .refine((consent) => consent === true, { error: errors.consent }),
      website: z.string().max(500).optional(),
    })
    .refine(
      ({ code, phone }) => {
        const fullPhone = toFullPhone(code, phone);
        const digits = countDigits(fullPhone);
        return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS && fullPhone.length <= MAX_PHONE_LENGTH;
      },
      { path: ["phone"], error: errors.phone },
    );
}

export type EnquiryValues = z.input<ReturnType<typeof createEnquirySchema>>;
