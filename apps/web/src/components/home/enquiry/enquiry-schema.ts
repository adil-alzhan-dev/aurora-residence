import { z } from "zod";

import type { Dictionary } from "@/content";

const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

const countDigits = (value: string) => value.replace(/\D/g, "").length;

/** Mirrors CreateEnquiryDto in apps/api: name 2-80, "+" code and 7-15 digits in total, valid email. */
export function createEnquirySchema(errors: Dictionary["enquiry"]["errors"]) {
  return z
    .object({
      name: z.string().trim().min(2, { error: errors.name }).max(80, { error: errors.name }),
      code: z.string().regex(/^\+\d{1,4}$/, { error: errors.code }),
      phone: z
        .string()
        .trim()
        .regex(/^[\d\s()-]+$/, { error: errors.phone }),
      email: z.string().trim().max(254, { error: errors.email }).pipe(z.email({ error: errors.email })),
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
