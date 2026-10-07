import { describe, expect, it } from "vitest";

import { adminEn } from "@/content/en-admin";
import { adminRu } from "@/content/ru-admin";

import { adminFormat } from "./admin-format";
import { apiMessageText, authorText, noteText, sourceText } from "./api-texts";

const ru = { messages: adminRu.messages, statuses: adminRu.facade.statuses };
const en = { messages: adminEn.messages, statuses: adminEn.facade.statuses };
const ruFormat = adminFormat("ru-RU");
const enFormat = adminFormat("en-US");

describe("apiMessageText", () => {
  it("recognises the API's refusals and fills in the numbers", () => {
    expect(apiMessageText("Residence 7.03 has no active reservation", adminRu.messages.api)).toBe(
      "У квартиры 7.03 нет активной брони.",
    );
    expect(
      apiMessageText(
        "Residence 7.03 is no longer available, someone has just changed it. Reload and try again.",
        adminRu.messages.api,
      ),
    ).toBe("Квартиру 7.03 только что изменили.");
    expect(apiMessageText("Enquiry 4 has no residence. Link it to 7.03 before reserving.", adminRu.messages.api)).toBe(
      "У заявки нет квартиры: сначала привяжите к ней 7.03.",
    );
  });

  it("returns null for a message it does not know", () => {
    expect(apiMessageText("Something unexpected", adminRu.messages.api)).toBeNull();
    expect(apiMessageText("", adminRu.messages.api)).toBeNull();
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
