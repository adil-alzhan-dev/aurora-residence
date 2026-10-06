import { describe, expect, it } from "vitest";

import { adminEn } from "@/content/en-admin";

import { AdminApiError, SessionExpiredError } from "./api-client";
import { changeErrorText, parsePrice } from "./change-errors";

const t = adminEn.residence;

describe("changeErrorText", () => {
  it("explains a conflict with the API detail", () => {
    const text = changeErrorText(new AdminApiError(409, "Residence 7.03 has no active reservation"), t);
    expect(text).toBe(`${t.errors.conflict} Residence 7.03 has no active reservation.`);
  });

  it("points at the price when the API rejects it", () => {
    expect(changeErrorText(new AdminApiError(400, "Validation failed", { priceUsd: "too low" }), t)).toBe(
      t.priceStatus.priceInvalid,
    );
    expect(changeErrorText(new AdminApiError(400, "Send a new priceUsd or status"), t)).toBe(t.errors.rejected);
  });

  it("stays quiet when the session expired, the page goes to sign-in", () => {
    expect(changeErrorText(new SessionExpiredError(), t)).toBeNull();
    expect(changeErrorText(new TypeError("fetch failed"), t)).toBe(t.errors.failed);
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
