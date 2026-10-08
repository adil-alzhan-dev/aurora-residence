import * as z from "zod/mini";

import type { Dictionary } from "@/content";

import type { ErrorCode } from "../../../../api/src/common/error-codes";

export const ENQUIRIES_PATH = "/api/enquiries";

const ERROR_CODE_VALIDATION: ErrorCode = "VALIDATION_FAILED";

const REQUEST_TIMEOUT_MS = 15_000;

export type EnquirySource = "Residence page" | "Contacts form";

/** Body of POST /api/enquiries, see CreateEnquiryDto in apps/api. */
export type EnquiryPayload = {
  name: string;
  phone: string;
  email: string;
  comment?: string;
  residence?: string;
  source: EnquirySource;
  consent: true;
  website: string;
  locale: "EN" | "RU";
};

/** Codes the form explains in its own words: key of the site dictionary's `enquirySend`. */
export const ENQUIRY_ERROR_TEXTS = {
  RATE_LIMITED: "rateLimited",
  RESIDENCE_SOLD: "soldRejected",
  RESIDENCE_NOT_FOUND: "residenceMissing",
} as const satisfies Partial<Record<ErrorCode, keyof Dictionary["enquirySend"]>>;

export type EnquiryErrorText = (typeof ENQUIRY_ERROR_TEXTS)[keyof typeof ENQUIRY_ERROR_TEXTS];

export type EnquiryResult =
  | { kind: "sent"; residence: string | null }
  | { kind: "invalid"; fields: Record<string, string> }
  | { kind: "refused"; text: EnquiryErrorText }
  | { kind: "failed" };

const receiptSchema = z.object({ residence: z.nullable(z.string()) });
const errorSchema = z.object({
  code: z.optional(z.string()),
  errors: z.optional(z.record(z.string(), z.string())),
});

/** The form's text for a refusal: by its code, else by the status; null means the general text. */
export function enquiryErrorText(code: string | null, status: number): EnquiryErrorText | null {
  if (code !== null && Object.hasOwn(ENQUIRY_ERROR_TEXTS, code)) {
    return ENQUIRY_ERROR_TEXTS[code as keyof typeof ENQUIRY_ERROR_TEXTS];
  }
  return code === null && status === 429 ? ENQUIRY_ERROR_TEXTS.RATE_LIMITED : null;
}

/** Decided by the error code only; the English message of the API is never shown or read. */
export async function readEnquiryResponse(response: Response): Promise<EnquiryResult> {
  const body: unknown = await response.json().catch(() => null);

  // The enquiry is stored once the API answers 2xx, so an odd body must not invite a second send.
  if (response.ok) {
    const receipt = receiptSchema.safeParse(body);
    return { kind: "sent", residence: receipt.success ? receipt.data.residence : null };
  }
  const parsed = errorSchema.safeParse(body);
  const { code = null, errors = {} } = parsed.success ? parsed.data : {};
  if (code === ERROR_CODE_VALIDATION && Object.keys(errors).length > 0) return { kind: "invalid", fields: errors };
  const text = enquiryErrorText(code, response.status);
  return text ? { kind: "refused", text } : { kind: "failed" };
}

export async function sendEnquiry(payload: EnquiryPayload): Promise<EnquiryResult> {
  try {
    const response = await fetch(ENQUIRIES_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return await readEnquiryResponse(response);
  } catch {
    return { kind: "failed" };
  }
}
