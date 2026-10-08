import type { AdminDictionary } from "@/content/en-admin";
import { fillTemplate } from "@/lib/format";

import { AdminApiError, SessionExpiredError } from "./api-client";
import { apiErrorText, hasCode } from "./api-texts";

type Texts = AdminDictionary["enquiry"]["errors"];
type ApiTexts = AdminDictionary["messages"]["api"];

/** null when there is nothing to show: no error, or the sign-in page is already on its way. */
function apiError(error: unknown): AdminApiError | "network" | null {
  if (!error || error instanceof SessionExpiredError) return null;
  return error instanceof AdminApiError ? error : "network";
}

/** A refused status or note change: someone changed the enquiry, or a value was not accepted. */
export function enquiryChangeErrorText(error: unknown, t: Texts, api: ApiTexts): string | null {
  const failure = apiError(error);
  if (!failure) return null;
  if (failure === "network") return t.failed;
  if (hasCode(failure, "CONFLICT")) return t.conflict;
  if (hasCode(failure, "VALIDATION_FAILED", "NOTHING_TO_UPDATE", "BAD_REQUEST")) return t.rejected;
  return apiErrorText(failure, api);
}

/** Reasons that belong to the enquiry, so the reservation text names them after "cannot be used". */
const ENQUIRY_REASONS = [
  "ENQUIRY_NOT_FOUND",
  "ENQUIRY_HAS_NO_RESIDENCE",
  "ENQUIRY_RESIDENCE_MISMATCH",
  "ENQUIRY_CLOSED",
  "RESIDENCE_NOT_FOUND",
] as const;

/** A refused reservation: the residence is taken or sold, or the enquiry does not fit. */
export function reserveErrorText(error: unknown, number: string, t: Texts, api: ApiTexts): string | null {
  const failure = apiError(error);
  if (!failure) return null;
  if (failure === "network") return t.failed;
  if (hasCode(failure, "RESIDENCE_RESERVED")) return fillTemplate(t.reserveReserved, { number });
  if (hasCode(failure, "RESIDENCE_SOLD")) return fillTemplate(t.reserveSold, { number });
  if (hasCode(failure, "CONFLICT")) return fillTemplate(t.reserveConflict, { number });
  if (hasCode(failure, ...ENQUIRY_REASONS)) {
    return fillTemplate(t.reserveRejected, { detail: apiErrorText(failure, api, { number }) });
  }
  if (hasCode(failure, "VALIDATION_FAILED", "BAD_REQUEST")) return fillTemplate(t.reserveRejected, { detail: "" }).trim();
  return apiErrorText(failure, api, { number });
}

type LinkTexts = Texts & { invalid: string };

/** A refused link: no such residence, a sold residence, or a residence linked a moment ago. */
export function linkErrorText(error: unknown, number: string, t: LinkTexts, api: ApiTexts): string | null {
  const failure = apiError(error);
  if (!failure) return null;
  if (failure === "network") return t.failed;
  if (hasCode(failure, "VALIDATION_FAILED")) return t.invalid;
  if (hasCode(failure, "RESIDENCE_NOT_FOUND")) return fillTemplate(t.linkMissing, { number });
  if (hasCode(failure, "RESIDENCE_SOLD")) return fillTemplate(t.linkSold, { number });
  if (hasCode(failure, "ENQUIRY_RESIDENCE_EXISTS")) return t.linkTaken;
  return apiErrorText(failure, api, { number });
}
