import { describe, expect, it } from "vitest";

import { adminEn } from "@/content/en-admin";

import { AdminApiError, SessionExpiredError } from "./api-client";
import { enquiryChangeErrorText, reserveErrorText } from "./enquiry-errors";

const t = adminEn.enquiry.errors;

describe("enquiry change errors", () => {
  it("says what a refused change means", () => {
    expect(enquiryChangeErrorText(new AdminApiError(409, "Conflict"), t)).toBe(t.conflict);
    expect(enquiryChangeErrorText(new AdminApiError(400, "managerNote must be shorter"), t)).toBe(t.rejected);
    expect(enquiryChangeErrorText(new TypeError("Failed to fetch"), t)).toBe(t.failed);
  });

  it("stays quiet without an error or when the session is over", () => {
    expect(enquiryChangeErrorText(null, t)).toBeNull();
    expect(enquiryChangeErrorText(new SessionExpiredError(), t)).toBeNull();
  });
});

describe("reservation errors", () => {
  it("turns 409 into plain words about the residence", () => {
    const error = new AdminApiError(409, "Residence 7.03 is reserved, only an available residence can be reserved");
    expect(reserveErrorText(error, "7.03", t)).toBe(
      "Residence 7.03 cannot be reserved: it is no longer available, someone reserved or sold it a moment ago. The card now shows the current state.",
    );
  });

  it("passes on why the API refused the enquiry", () => {
    const error = new AdminApiError(400, "Enquiry 12 is closed, reopen it before reserving");
    expect(reserveErrorText(error, "7.03", t)).toBe(
      "This enquiry cannot be used for the reservation. Enquiry 12 is closed, reopen it before reserving.",
    );
    expect(reserveErrorText(new AdminApiError(400), "7.03", t)).toBe("This enquiry cannot be used for the reservation.");
  });

  it("falls back to a connection problem", () => {
    expect(reserveErrorText(new AdminApiError(500), "7.03", t)).toBe(t.failed);
    expect(reserveErrorText(new SessionExpiredError(), "7.03", t)).toBeNull();
  });
});
