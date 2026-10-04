import { z } from "zod";

const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;
const MAX_COMMENT_LENGTH = 2000;

const countDigits = (value: string) => value.replace(/\D/g, "").length;

type EnquiryErrors = {
  name: string;
  code: string;
  phone: string;
  email: string;
  comment?: string;
  consent: string;
};

/**
 * Mirrors CreateEnquiryDto in apps/api: name 2-80, "+" code and 7-15 digits in total, valid email,
 * comment up to 2000 characters and an explicit consent tick, which the API requires.
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
        const digits = countDigits(code) + countDigits(phone);
        return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS;
      },
      { path: ["phone"], error: errors.phone },
    );
}

export type EnquiryValues = z.input<ReturnType<typeof createEnquirySchema>>;
