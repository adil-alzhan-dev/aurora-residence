import { describe, expect, it } from "vitest";

import { adminEn } from "@/content/en-admin";
import { adminRu } from "@/content/ru-admin";

import { adminFormat } from "./admin-format";
import { apiErrorKey, apiErrorText, authorText, hasCode, noteText, sourceText } from "./api-texts";

const ru = { messages: adminRu.messages, statuses: adminRu.facade.statuses };
const en = { messages: adminEn.messages, statuses: adminEn.facade.statuses };
const ruFormat = adminFormat("ru-RU");
const enFormat = adminFormat("en-US");

describe("apiErrorText", () => {
  it("picks the text by code and fills in the residence", () => {
    expect(apiErrorText({ status: 409, code: "NO_ACTIVE_RESERVATION" }, adminRu.messages.api, { number: "7.03" })).toBe(
      "У квартиры 7.03 нет активной брони.",
    );
    expect(apiErrorText({ status: 400, code: "ENQUIRY_HAS_NO_RESIDENCE" }, adminEn.messages.api, { number: "7.03" })).toBe(
      "The enquiry has no residence yet: link it to 7.03 first.",
    );
  });

  it("uses the code even when the same code comes with another status", () => {
    const notFound = adminEn.messages.api.residenceNotFound;
    expect(apiErrorKey({ status: 404, code: "RESIDENCE_NOT_FOUND" })).toBe("residenceNotFound");
    expect(apiErrorKey({ status: 400, code: "RESIDENCE_NOT_FOUND" })).toBe("residenceNotFound");
    expect(apiErrorText({ status: 400, code: "RESIDENCE_NOT_FOUND" }, adminEn.messages.api)).toBe(notFound);
  });

  it("falls back to the HTTP status for an unknown or missing code", () => {
    expect(apiErrorKey({ status: 409, code: "SOMETHING_NEW" })).toBe("conflict");
    expect(apiErrorKey({ status: 429, code: null })).toBe("rateLimited");
    expect(apiErrorKey({ status: 404, code: null })).toBe("notFound");
    expect(apiErrorKey({ status: 502, code: null })).toBe("internalError");
    expect(apiErrorKey({ status: 400, code: "toString" })).toBe("badRequest");
  });
});

describe("hasCode", () => {
  it("matches only the codes asked for", () => {
    expect(hasCode({ code: "RESIDENCE_SOLD" }, "RESIDENCE_RESERVED", "RESIDENCE_SOLD")).toBe(true);
    expect(hasCode({ code: "RESIDENCE_SOLD" }, "RESIDENCE_RESERVED")).toBe(false);
    expect(hasCode({ code: null }, "CONFLICT")).toBe(false);
  });
});

describe("noteText", () => {
  it("translates notes the system writes", () => {
    expect(noteText("Reserved for 7 days, enquiry from Elena Marsh", ru, ruFormat)).toBe(
      "Бронь на 7\u00a0дней по заявке Elena Marsh",
    );
    expect(noteText("Enquiry received from the site, residence 7.03 stays Available", ru, ruFormat)).toBe(
      "Заявка с сайта, квартира 7.03 остаётся свободной",
    );
    expect(noteText("Enquiry received from the site, residence 7.02 is Sold, status not changed", ru, ruFormat)).toBe(
      "Заявка с сайта, квартира 7.02: Продана, статус не менялся",
    );
    expect(noteText("Sales start, listed at $206 000", ru, ruFormat)).toBe("Старт продаж, цена 206 000 $");
    expect(noteText("Autumn price list", ru, ruFormat)).toBe("Осенний прайс");
  });

  it("keeps English notes as they are and leaves a manager's own words alone", () => {
    expect(noteText("Reserved for 7 days, enquiry from Elena Marsh", en, enFormat)).toBe(
      "Reserved for 7 days, enquiry from Elena Marsh",
    );
    expect(noteText("Sales start, listed at $206 000", en, enFormat)).toBe("Sales start, listed at $206 000");
    expect(noteText("Called back, wants a discount", ru, ruFormat)).toBe("Called back, wants a discount");
  });
});

describe("authorText and sourceText", () => {
  it("translate only the labels, never the stored values", () => {
    expect(authorText("System", adminRu.messages)).toBe("Система");
    expect(authorText("Maya Collins", adminRu.messages)).toBe("Maya Collins");
    expect(sourceText("Contacts form", adminRu.messages)).toBe("Форма контактов");
    expect(sourceText("Residence page", adminRu.messages)).toBe("Страница квартиры");
    expect(sourceText("Contacts form", adminEn.messages)).toBe("Contacts form");
    expect(sourceText("Partner site", adminRu.messages)).toBe("Partner site");
  });
});
