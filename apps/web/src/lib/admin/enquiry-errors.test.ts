import { describe, expect, it } from "vitest";

import { adminEn } from "@/content/en-admin";
import { adminRu } from "@/content/ru-admin";

import { AdminApiError, SessionExpiredError } from "./api-client";
import { enquiryChangeErrorText, linkErrorText, reserveErrorText } from "./enquiry-errors";

const t = adminEn.enquiry.errors;
const api = adminEn.messages.api;

// The English message is for logs only: it says something else on purpose, the code decides.
const refusal = (status: number, code: string | null, fieldErrors?: Record<string, string>) =>
  new AdminApiError(status, { code, message: "Residence 7.02 is sold", fieldErrors });

describe("enquiry change errors", () => {
  it("says what a refused change means", () => {
    expect(enquiryChangeErrorText(refusal(409, "CONFLICT"), t, api)).toBe(t.conflict);
    expect(enquiryChangeErrorText(refusal(400, "VALIDATION_FAILED", { managerNote: "too long" }), t, api)).toBe(t.rejected);
    expect(enquiryChangeErrorText(refusal(400, "NOTHING_TO_UPDATE"), t, api)).toBe(t.rejected);
    expect(enquiryChangeErrorText(new TypeError("Failed to fetch"), t, api)).toBe(t.failed);
  });

  it("names a code it has no own words for and falls back to the status without one", () => {
    expect(enquiryChangeErrorText(refusal(404, "ENQUIRY_NOT_FOUND"), t, api)).toBe(api.enquiryNotFound);
    expect(enquiryChangeErrorText(refusal(503, null), t, api)).toBe(api.serviceUnavailable);
  });

  it("stays quiet without an error or when the session is over", () => {
    expect(enquiryChangeErrorText(null, t, api)).toBeNull();
    expect(enquiryChangeErrorText(new SessionExpiredError(), t, api)).toBeNull();
  });
});

describe("reservation errors", () => {
  it("tells a residence reserved a moment ago from a sold one", () => {
    expect(reserveErrorText(refusal(409, "RESIDENCE_RESERVED"), "7.03", t, api)).toBe(
      "Residence 7.03 cannot be reserved: someone reserved it a moment ago. The card now shows the current state.",
    );
    expect(reserveErrorText(refusal(409, "RESIDENCE_SOLD"), "7.03", adminRu.enquiry.errors, adminRu.messages.api)).toBe(
      "Квартиру 7.03 нельзя забронировать: её только что продали. Карточка показывает текущее состояние.",
    );
    expect(reserveErrorText(refusal(409, "CONFLICT"), "7.03", t, api)).toBe(
      "Residence 7.03 cannot be reserved: it is no longer available, someone reserved or sold it a moment ago. The card now shows the current state.",
    );
  });

  it("passes on the reason of the code in the reader's words", () => {
    expect(reserveErrorText(refusal(400, "ENQUIRY_CLOSED"), "7.03", t, api)).toBe(
      "This enquiry cannot be used for the reservation. The enquiry is closed: set it back to In progress first.",
    );
    expect(
      reserveErrorText(refusal(400, "ENQUIRY_RESIDENCE_MISMATCH"), "7.03", adminRu.enquiry.errors, adminRu.messages.api),
    ).toBe("Эту заявку нельзя использовать для брони. Заявка о другой квартире, а не о 7.03.");
    expect(reserveErrorText(refusal(400, "VALIDATION_FAILED"), "7.03", t, api)).toBe(
      "This enquiry cannot be used for the reservation.",
    );
  });

  it("falls back to the general text of the status", () => {
    expect(reserveErrorText(refusal(500, "INTERNAL_ERROR"), "7.03", t, api)).toBe(api.internalError);
    expect(reserveErrorText(refusal(429, null), "7.03", t, api)).toBe(api.rateLimited);
    expect(reserveErrorText(new TypeError("Failed to fetch"), "7.03", t, api)).toBe(t.failed);
    expect(reserveErrorText(new SessionExpiredError(), "7.03", t, api)).toBeNull();
  });
});

describe("residence link errors", () => {
  const texts = { ...t, invalid: adminEn.enquiry.link.invalid };

  it("explains a residence that does not exist and a malformed number", () => {
    expect(linkErrorText(refusal(400, "RESIDENCE_NOT_FOUND"), "12.01", texts, api)).toBe(
      "There is no residence 12.01 in the house. Numbers go from 1.01 to 11.06.",
    );
    const malformed = refusal(400, "VALIDATION_FAILED", { residenceNumber: "Residence number must look like 7.03" });
    expect(linkErrorText(malformed, "7.3", texts, api)).toBe(texts.invalid);
  });

  it("tells a sold residence from a residence linked a moment ago by the code alone", () => {
    expect(linkErrorText(refusal(409, "RESIDENCE_SOLD"), "7.02", texts, api)).toBe(
      "Residence 7.02 is sold, link another residence.",
    );
    expect(linkErrorText(refusal(409, "ENQUIRY_RESIDENCE_EXISTS"), "7.02", texts, api)).toBe(t.linkTaken);
    expect(linkErrorText(refusal(409, null), "7.02", texts, api)).toBe(api.conflict);
  });

  it("falls back to a connection problem", () => {
    expect(linkErrorText(new TypeError("Failed to fetch"), "7.03", texts, api)).toBe(t.failed);
    expect(linkErrorText(null, "7.03", texts, api)).toBeNull();
  });
});
