import type { AdminDictionary } from "@/content/en-admin";
import { fillTemplate } from "@/lib/format";

import { AdminApiError, SessionExpiredError } from "./api-client";

type Texts = AdminDictionary["enquiry"]["errors"];

const withStop = (message: string) => (/[.!?]$/.test(message) ? message : `${message}.`);

/** null when there is nothing to show: no error, or the sign-in page is already on its way. */
function apiError(error: unknown): AdminApiError | "network" | null {
  if (!error || error instanceof SessionExpiredError) return null;
  return error instanceof AdminApiError ? error : "network";
}

/** A refused status or note change: 409 means someone changed the enquiry, 400 a wrong value. */
export function enquiryChangeErrorText(error: unknown, t: Texts): string | null {
  const failure = apiError(error);
  if (!failure) return null;
  if (failure === "network") return t.failed;
  if (failure.status === 409) return t.conflict;
  if (failure.status === 400) return t.rejected;
  return t.failed;
}

/** A refused reservation: 409 means the residence is no longer available, 400 a wrong enquiry. */
export function reserveErrorText(error: unknown, number: string, t: Texts): string | null {
  const failure = apiError(error);
  if (!failure) return null;
  if (failure === "network") return t.failed;
  if (failure.status === 409) return fillTemplate(t.reserveConflict, { number });
  if (failure.status === 400 || failure.status === 404) {
    const detail = failure.message.startsWith("Admin API answered") ? "" : withStop(failure.message);
    return fillTemplate(t.reserveRejected, { detail }).trim();
  }
  return t.failed;
}

type LinkTexts = Texts & { invalid: string };

/** A refused link: 400 means no such residence, 409 a sold residence or a residence linked already. */
export function linkErrorText(error: unknown, number: string, t: LinkTexts): string | null {
  const failure = apiError(error);
  if (!failure) return null;
  if (failure === "network") return t.failed;
  if (failure.status === 400) return failure.fieldErrors.residenceNumber ? t.invalid : fillTemplate(t.linkMissing, { number });
  if (failure.status === 409) return /\bsold\b/i.test(failure.message) ? fillTemplate(t.linkSold, { number }) : t.linkTaken;
  return t.failed;
}
