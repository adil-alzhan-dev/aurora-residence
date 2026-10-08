import type { AdminDictionary } from "@/content/en-admin";
import { fillTemplate } from "@/lib/format";

import type { ErrorCode } from "../../../../api/src/common/error-codes";

import type { AdminFormat } from "./admin-format";

type Messages = AdminDictionary["messages"];
type ApiKey = keyof Messages["api"];
type NoteKey = Exclude<keyof Messages["notes"], "known">;

const NUMBER = String.raw`(?<number>\d{1,2}\.\d{2})`;

/** Every code of the API, see apps/api/src/common/error-codes.ts; the type keeps this table complete. */
const API_ERROR_KEYS: Record<ErrorCode, ApiKey> = {
  BAD_REQUEST: "badRequest",
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "notFound",
  CONFLICT: "conflict",
  PAYLOAD_TOO_LARGE: "payloadTooLarge",
  RATE_LIMITED: "rateLimited",
  INTERNAL_ERROR: "internalError",
  SERVICE_UNAVAILABLE: "serviceUnavailable",
  VALIDATION_FAILED: "validationFailed",
  NOTHING_TO_UPDATE: "nothingToUpdate",
  INVALID_CREDENTIALS: "invalidCredentials",
  LOGIN_LOCKED: "loginLocked",
  SESSION_EXPIRED: "sessionExpired",
  RESIDENCE_NOT_FOUND: "residenceNotFound",
  ENQUIRY_NOT_FOUND: "enquiryNotFound",
  RESIDENCE_SOLD: "residenceSold",
  RESIDENCE_RESERVED: "residenceReserved",
  NO_ACTIVE_RESERVATION: "noActiveReservation",
  ENQUIRY_HAS_NO_RESIDENCE: "enquiryHasNoResidence",
  ENQUIRY_RESIDENCE_MISMATCH: "enquiryResidenceMismatch",
  ENQUIRY_CLOSED: "enquiryClosed",
  ENQUIRY_RESIDENCE_EXISTS: "enquiryResidenceExists",
};

/** For an answer without a code the admin knows, e.g. from nginx or a newer API. */
const STATUS_KEYS: Partial<Record<number, ApiKey>> = {
  400: "badRequest",
  401: "unauthorized",
  403: "forbidden",
  404: "notFound",
  409: "conflict",
  413: "payloadTooLarge",
  429: "rateLimited",
  503: "serviceUnavailable",
};

const isKnownCode = (code: string | null): code is ErrorCode =>
  code !== null && Object.hasOwn(API_ERROR_KEYS, code);

/** True when the error carries one of `codes`; anything without a code is never a match. */
export function hasCode(error: { code: string | null }, ...codes: ErrorCode[]): boolean {
  return codes.some((code) => code === error.code);
}

/** The dictionary key for an error: by its code, otherwise by the HTTP status. */
export function apiErrorKey({ code, status }: { code: string | null; status: number }): ApiKey {
  if (isKnownCode(code)) return API_ERROR_KEYS[code];
  return STATUS_KEYS[status] ?? "internalError";
}

/** The reader's words for a refusal; `values` fills {number} where the text names the residence. */
export function apiErrorText(
  error: { code: string | null; status: number },
  t: Messages["api"],
  values: Record<string, string> = {},
): string {
  return fillTemplate(t[apiErrorKey(error)], values);
}

/** Notes the API and the demo data write into the history by themselves. */
const NOTES: [RegExp, NoteKey][] = [
  [new RegExp(String.raw`^Enquiry received from the site, residence ${NUMBER} stays Available$`), "received"],
  [
    new RegExp(String.raw`^Enquiry received from the site, residence ${NUMBER} is (?<status>\w+), status not changed$`),
    "receivedWithStatus",
  ],
  [/^Enquiry received from the site, no residence selected$/, "receivedGeneral"],
  [/^Reserved for 7 days$/, "reserved"],
  [/^Reserved for 7 days, enquiry from (?<name>.+)$/, "reservedFor"],
  [/^Reservation ended after 7 days without a deal$/, "expired"],
  [/^Reservation released by manager$/, "released"],
  [/^Back on sale$/, "backOnSale"],
  [/^Contract signed$/, "sold"],
  [/^Residence reserved for this enquiry$/, "reservedForEnquiry"],
  [new RegExp(String.raw`^Residence ${NUMBER} linked to the enquiry$`), "linked"],
  [/^Sales start, listed at \$(?<price>[\d\s,]+)$/, "salesStart"],
];

function findMatch<Key extends string>(text: string, rules: [RegExp, Key][]) {
  for (const [pattern, key] of rules) {
    const match = pattern.exec(text);
    if (match) return { key, groups: match.groups ?? {} };
  }
  return null;
}

type NoteTexts = { messages: Messages; statuses: AdminDictionary["facade"]["statuses"] };

/** A note written by the system is translated; a note a manager typed stays as it was written. */
export function noteText(note: string, t: NoteTexts, format: AdminFormat): string {
  const known = t.messages.notes.known[note];
  if (known) return known;
  const match = findMatch(note, NOTES);
  if (!match) return note;
  const { status, price, ...groups } = match.groups;
  const values: Record<string, string> = { ...groups };
  if (status) values.status = t.statuses[status.toUpperCase() as keyof NoteTexts["statuses"]] ?? status;
  if (price) values.price = format.price(Number(price.replace(/\D/g, "")));
  return fillTemplate(t.messages.notes[match.key], values);
}

export const authorText = (author: string, t: Messages) => (author === "System" ? t.system : author);

/** The stored source stays "Contacts form", "Residence page" and so on; only its label is translated. */
export const sourceText = (source: string, t: Messages) => t.sources[source] ?? source;
