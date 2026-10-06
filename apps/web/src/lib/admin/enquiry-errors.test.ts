import { describe, expect, it } from "vitest";

import { adminEn } from "@/content/en-admin";

import { AdminApiError, SessionExpiredError } from "./api-client";
import { enquiryChangeErrorText, linkErrorText, reserveErrorText } from "./enquiry-errors";

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

describe("residence link errors", () => {
  const texts = { ...t, invalid: adminEn.enquiry.link.invalid };

  it("explains 400 for a residence that does not exist or a malformed number", () => {
    expect(linkErrorText(new AdminApiError(400, "Residence 12.01 does not exist"), "12.01", texts)).toBe(
      "There is no residence 12.01 in the house. Numbers go from 1.01 to 11.06.",
    );
    const malformed = new AdminApiError(400, "Residence number must look like 7.03", {
      residenceNumber: "Residence number must look like 7.03",
    });
    expect(linkErrorText(malformed, "7.3", texts)).toBe(texts.invalid);
  });

  it("tells a sold residence from a residence linked a moment ago", () => {
    expect(linkErrorText(new AdminApiError(409, "Residence 7.02 is sold"), "7.02", texts)).toBe(
      "Residence 7.02 is sold, link another residence.",
    );
    expect(linkErrorText(new AdminApiError(409, "Enquiry already has residence 4.06"), "7.03", texts)).toBe(t.linkTaken);
  });

  it("falls back to a connection problem", () => {
    expect(linkErrorText(new TypeError("Failed to fetch"), "7.03", texts)).toBe(t.failed);
    expect(linkErrorText(null, "7.03", texts)).toBeNull();
  });
});
