import { describe, expect, it } from "vitest";

import { adminEn } from "@/content/en-admin";
import { adminRu } from "@/content/ru-admin";

import { AdminApiError, SessionExpiredError } from "./api-client";
import { changeErrorText, parsePrice } from "./change-errors";

const t = adminEn.residence;
const api = adminEn.messages.api;

describe("changeErrorText", () => {
  it("explains a conflict with a known API detail and drops an unknown one", () => {
    const text = changeErrorText(new AdminApiError(409, "Residence 7.03 has no active reservation"), t, api);
    expect(text).toBe(`${t.errors.conflict} Residence 7.03 has no active reservation.`);
    expect(changeErrorText(new AdminApiError(409, "Something new went wrong"), t, api)).toBe(t.errors.conflict);
  });

  it("speaks Russian for a Russian dictionary", () => {
    const text = changeErrorText(new AdminApiError(409, "Residence 7.03 has no active reservation"), adminRu.residence, adminRu.messages.api);
    expect(text).toBe(`${adminRu.residence.errors.conflict} У квартиры 7.03 нет активной брони.`);
  });

  it("points at the price when the API rejects it", () => {
    expect(changeErrorText(new AdminApiError(400, "Validation failed", { priceUsd: "too low" }), t, api)).toBe(
      t.priceStatus.priceInvalid,
    );
    expect(changeErrorText(new AdminApiError(400, "Send a new priceUsd or status"), t, api)).toBe(t.errors.rejected);
  });

  it("stays quiet when the session expired, the page goes to sign-in", () => {
    expect(changeErrorText(new SessionExpiredError(), t, api)).toBeNull();
    expect(changeErrorText(new TypeError("fetch failed"), t, api)).toBe(t.errors.failed);
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
