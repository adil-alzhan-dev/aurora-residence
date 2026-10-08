import type { AdminDictionary } from "@/content/en-admin";

import { AdminApiError, SessionExpiredError } from "./api-client";
import { apiErrorText, hasCode } from "./api-texts";

type Texts = AdminDictionary["residence"];

/** Plain words for a refused change of residence `number`: it changed under us, or a value was wrong. */
export function changeErrorText(
  error: unknown,
  number: string,
  t: Texts,
  api: AdminDictionary["messages"]["api"],
): string | null {
  if (!error || error instanceof SessionExpiredError) return null;
  if (!(error instanceof AdminApiError)) return t.errors.failed;
  if (hasCode(error, "VALIDATION_FAILED")) return error.fieldErrors.priceUsd ? t.priceStatus.priceInvalid : t.errors.rejected;
  if (hasCode(error, "NOTHING_TO_UPDATE", "BAD_REQUEST")) return t.errors.rejected;
  if (hasCode(error, "CONFLICT")) return t.errors.conflict;
  if (hasCode(error, "NO_ACTIVE_RESERVATION", "RESIDENCE_RESERVED", "RESIDENCE_SOLD")) {
    return `${t.errors.conflict} ${apiErrorText(error, api, { number })}`;
  }
  return apiErrorText(error, api, { number });
}

const PRICE_MIN = 10_000;
const PRICE_MAX = 10_000_000;

/** "$218 000", "218,000" and "218000" all mean 218000; anything else is not a price. */
export function parsePrice(raw: string): number | null {
  const digits = raw.replace(/[\s$, ]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const value = Number(digits);
  return value >= PRICE_MIN && value <= PRICE_MAX ? value : null;
}
