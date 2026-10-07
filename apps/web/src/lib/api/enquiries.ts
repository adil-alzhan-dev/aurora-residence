import { z } from "zod";

export const ENQUIRIES_PATH = "/api/enquiries";

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

export type EnquiryResult =
  | { kind: "sent"; residence: string | null }
  | { kind: "invalid"; fields: Record<string, string> }
  | { kind: "rejected"; message: string }
  | { kind: "rate-limited" }
  | { kind: "failed" };

const receiptSchema = z.object({ residence: z.string().nullable() });
const fieldErrorsSchema = z.object({ errors: z.record(z.string(), z.string()) });
const rejectionSchema = z.object({ message: z.string().min(1) });

export async function readEnquiryResponse(response: Response): Promise<EnquiryResult> {
  const body: unknown = await response.json().catch(() => null);

  // The enquiry is stored once the API answers 2xx, so an odd body must not invite a second send.
  if (response.ok) {
    const receipt = receiptSchema.safeParse(body);
    return { kind: "sent", residence: receipt.success ? receipt.data.residence : null };
  }
  if (response.status === 429) return { kind: "rate-limited" };
  if (response.status === 400) {
    const fieldErrors = fieldErrorsSchema.safeParse(body);
    if (fieldErrors.success && Object.keys(fieldErrors.data.errors).length > 0) {
      return { kind: "invalid", fields: fieldErrors.data.errors };
    }
    const rejection = rejectionSchema.safeParse(body);
    if (rejection.success) return { kind: "rejected", message: rejection.data.message };
  }
  return { kind: "failed" };
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
