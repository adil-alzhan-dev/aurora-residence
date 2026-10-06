import { describe, expect, it } from "vitest";

import { reservableEnquiries, reservationEnd, reserveState } from "./reservation-rules";
import type { AdminEnquiryListItem, AdminResidenceStatus, EnquiryCard } from "./schemas";

const endsAt = new Date(2026, 9, 11, 11, 52);

const enquiry = (
  status: EnquiryCard["status"],
  residenceStatus: AdminResidenceStatus | null,
  reservation: EnquiryCard["reservation"] = null,
) => ({
  status,
  reservation,
  residence: residenceStatus
    ? { number: "7.03", status: residenceStatus, priceUsd: 218_000, bedrooms: 2, areaM2: 84.2, isPenthouse: false }
    : null,
});

describe("reserve from an enquiry", () => {
  it("offers the reservation for an open enquiry on an available residence", () => {
    expect(reserveState(enquiry("IN_PROGRESS", "AVAILABLE"))).toEqual({ kind: "can-reserve" });
    expect(reserveState(enquiry("NEW", "AVAILABLE"))).toEqual({ kind: "can-reserve" });
  });

  it("asks to link a residence to a general enquiry first", () => {
    expect(reserveState(enquiry("NEW", null))).toEqual({ kind: "general" });
  });

  it("explains why a reserved or sold residence cannot be reserved", () => {
    expect(reserveState(enquiry("IN_PROGRESS", "RESERVED", { startsAt: new Date(), endsAt }))).toEqual({
      kind: "reserved-here",
      endsAt,
    });
    expect(reserveState(enquiry("IN_PROGRESS", "RESERVED"))).toEqual({ kind: "reserved-else" });
    expect(reserveState(enquiry("IN_PROGRESS", "SOLD"))).toEqual({ kind: "sold" });
    expect(reserveState(enquiry("CLOSED", "SOLD"))).toEqual({ kind: "sold" });
  });

  it("does not reserve for a closed enquiry", () => {
    expect(reserveState(enquiry("CLOSED", "AVAILABLE"))).toEqual({ kind: "closed" });
  });
});

describe("enquiries the residence card can reserve for", () => {
  const item = (id: number, status: AdminEnquiryListItem["status"], residence: string | null = "7.03") => ({
    id,
    name: `Client ${id}`,
    phone: "+1 (555) 014-2271",
    email: "client@example.com",
    status,
    source: "Residence page",
    residence,
    createdAt: new Date(2026, 9, 4),
  });
  const items = [item(1, "IN_PROGRESS"), item(2, "CLOSED"), item(3, "NEW"), item(4, "NEW", "7.04")];

  it("keeps open enquiries about this residence", () => {
    expect(reservableEnquiries(items, "7.03", "AVAILABLE").map((entry) => entry.id)).toEqual([1, 3]);
  });

  it("offers nothing unless the residence is available", () => {
    expect(reservableEnquiries(items, "7.03", "RESERVED")).toEqual([]);
    expect(reservableEnquiries(items, "7.03", "SOLD")).toEqual([]);
  });

  it("ends a reservation 7 days after it starts", () => {
    expect(reservationEnd(new Date(2026, 9, 4, 11, 52))).toEqual(endsAt);
  });
});
