import type { AdminDictionary } from "@/content/en-admin";

import { AdminApiError, SessionExpiredError } from "./api-client";
import { apiMessageText } from "./api-texts";

type Texts = AdminDictionary["residence"];

/** Plain words for a refused change: 409 means the residence changed under us, 400 a wrong value. */
export function changeErrorText(error: unknown, t: Texts, api: AdminDictionary["messages"]["api"]): string | null {
  if (!error || error instanceof SessionExpiredError) return null;
  if (!(error instanceof AdminApiError)) return t.errors.failed;
  if (error.status === 409) {
    const detail = apiMessageText(error.message, api);
    return detail ? `${t.errors.conflict} ${detail}` : t.errors.conflict;
  }
  if (error.status === 400) return error.fieldErrors.priceUsd ? t.priceStatus.priceInvalid : t.errors.rejected;
  return t.errors.failed;
}

const PRICE_MIN = 10_000;
const PRICE_MAX = 10_000_000;

/** "$218 000", "218,000" and "218000" all mean 218000; anything else is not a price. */
export function parsePrice(raw: string): number | null {
  const digits = raw.replace(/[\s$, ]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const value = Number(digits);
  return value >= PRICE_MIN && value <= PRICE_MAX ? value : null;
}
