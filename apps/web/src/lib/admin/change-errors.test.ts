import { describe, expect, it } from "vitest";

import { adminEn } from "@/content/en-admin";
import { adminRu } from "@/content/ru-admin";

import { AdminApiError, SessionExpiredError } from "./api-client";
import { changeErrorText, parsePrice } from "./change-errors";

const t = adminEn.residence;
const api = adminEn.messages.api;

// The English message is for logs only: these say the opposite of the code on purpose.
const refusal = (status: number, code: string | null, fieldErrors?: Record<string, string>) =>
  new AdminApiError(status, { code, message: "Residence 7.03 is sold", fieldErrors });

describe("changeErrorText", () => {
  it("explains a conflict with the reason named by the code", () => {
    const text = changeErrorText(refusal(409, "NO_ACTIVE_RESERVATION"), "7.03", t, api);
    expect(text).toBe(`${t.errors.conflict} Residence 7.03 has no active reservation.`);
    expect(changeErrorText(refusal(409, "CONFLICT"), "7.03", t, api)).toBe(t.errors.conflict);
  });

  it("speaks Russian for a Russian dictionary", () => {
    const text = changeErrorText(refusal(409, "NO_ACTIVE_RESERVATION"), "7.03", adminRu.residence, adminRu.messages.api);
    expect(text).toBe(`${adminRu.residence.errors.conflict} У квартиры 7.03 нет активной брони.`);
  });

  it("points at the price when the API rejects it", () => {
    expect(changeErrorText(refusal(400, "VALIDATION_FAILED", { priceUsd: "too low" }), "7.03", t, api)).toBe(
      t.priceStatus.priceInvalid,
    );
    expect(changeErrorText(refusal(400, "NOTHING_TO_UPDATE"), "7.03", t, api)).toBe(t.errors.rejected);
  });

  it("uses the general text of the status for an unknown or missing code", () => {
    expect(changeErrorText(refusal(409, "SOMETHING_NEW"), "7.03", t, api)).toBe(api.conflict);
    expect(changeErrorText(refusal(404, "RESIDENCE_NOT_FOUND"), "12.01", t, api)).toBe("There is no residence 12.01.");
    expect(changeErrorText(refusal(500, null), "7.03", t, api)).toBe(api.internalError);
  });

  it("stays quiet when the session expired, the page goes to sign-in", () => {
    expect(changeErrorText(new SessionExpiredError(), "7.03", t, api)).toBeNull();
    expect(changeErrorText(new TypeError("fetch failed"), "7.03", t, api)).toBe(t.errors.failed);
  });
});

describe("parsePrice", () => {
  it("accepts dollars written the usual ways", () => {
    expect(parsePrice("$218 000")).toBe(218_000);
    expect(parsePrice("218,000")).toBe(218_000);
    expect(parsePrice("218 000")).toBe(218_000);
  });

  it("rejects cents, words and prices out of range", () => {
    expect(parsePrice("218000.50")).toBeNull();
    expect(parsePrice("abc")).toBeNull();
    expect(parsePrice("9999")).toBeNull();
    expect(parsePrice("10000001")).toBeNull();
  });
});
