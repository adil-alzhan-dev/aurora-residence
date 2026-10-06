import type { AdminDictionary } from "@/content/en-admin";

import { AdminApiError, SessionExpiredError } from "./api-client";

type Texts = AdminDictionary["enquiry"]["errors"];

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
