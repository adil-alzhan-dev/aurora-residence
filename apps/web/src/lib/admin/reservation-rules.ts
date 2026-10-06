import type { AdminEnquiryListItem, AdminResidenceStatus, EnquiryCard } from "./schemas";

export const RESERVATION_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ReserveState =
  | { kind: "can-reserve" }
  | { kind: "general" }
  | { kind: "closed" }
  | { kind: "reserved-here"; endsAt: Date }
  | { kind: "reserved-else" }
  | { kind: "sold" };

/**
 * Whether the enquiry card offers "Reserve for 7 days". The API allows a reservation only
 * for an open enquiry about this very residence while the residence is Available.
 */
export function reserveState(enquiry: Pick<EnquiryCard, "status" | "residence" | "reservation">): ReserveState {
  const { residence, reservation } = enquiry;
  if (!residence) return { kind: "general" };
  if (residence.status === "RESERVED" && reservation) return { kind: "reserved-here", endsAt: reservation.endsAt };
  if (residence.status === "SOLD") return { kind: "sold" };
  if (residence.status === "RESERVED") return { kind: "reserved-else" };
  if (enquiry.status === "CLOSED") return { kind: "closed" };
  return { kind: "can-reserve" };
}

/** Enquiries the residence card can reserve for: about this residence and not closed. */
export function reservableEnquiries(items: AdminEnquiryListItem[], number: string, status: AdminResidenceStatus) {
  if (status !== "AVAILABLE") return [];
  return items.filter((item) => item.residence === number && item.status !== "CLOSED");
}

export const reservationEnd = (from: Date) => new Date(from.getTime() + RESERVATION_DAYS * DAY_MS);
