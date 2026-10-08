import { describe, expect, it } from "vitest";

import { formatDecimal, joinPhrase, lowerFirst } from "./format";
import { formatMoney, type CurrencyRates } from "./money";
import { plural, pluralForms } from "./plural";

const RATES: CurrencyRates = { USD: 1, EUR: 0.92, KZT: 505 };

// ru-RU groups digits with a no-break space (U+00A0); written out so the expectation is explicit.
const NBSP = " ";

describe("Russian number formatting", () => {
  it("formats residence 7.03 prices with the symbol after the amount", () => {
    expect(formatMoney(218_000, { currency: "USD", rates: RATES, locale: "ru-RU" })).toBe(`218${NBSP}000${NBSP}$`);
    expect(formatMoney(218_000, { currency: "EUR", rates: RATES, locale: "ru-RU" })).toBe(`200${NBSP}560${NBSP}€`);
    expect(formatMoney(218_000, { currency: "KZT", rates: RATES, locale: "ru-RU" })).toBe(
      `110${NBSP}090${NBSP}000${NBSP}₸`,
    );
  });

  it("formats the 7.03 instalment amounts", () => {
    expect(formatMoney(65_400, { currency: "USD", rates: RATES, locale: "ru-RU" })).toBe(`65${NBSP}400${NBSP}$`);
    expect(formatMoney(6_358, { currency: "USD", rates: RATES, locale: "ru-RU" })).toBe(`6${NBSP}358${NBSP}$`);
  });

  it("writes areas and heights with a decimal comma", () => {
    expect(formatDecimal(84.2, "ru-RU")).toBe("84,2");
    expect(formatDecimal(3.2, "ru-RU")).toBe("3,2");
    expect(formatDecimal(84.2, "en-US")).toBe("84.2");
    expect(formatDecimal(164, "en-US")).toBe("164.0");
  });
});

describe("plural", () => {
  const residences = pluralForms("квартира", "квартиры", "квартир");

  it("picks Russian forms for 1, 3, 5, 11, 21 and 22", () => {
    expect([1, 3, 5, 11, 21, 22].map((count) => `${count} ${plural(count, residences, "ru-RU")}`)).toEqual([
      "1 квартира",
      "3 квартиры",
      "5 квартир",
      "11 квартир",
      "21 квартира",
      "22 квартиры",
    ]);
  });

  it("uses one and other in English", () => {
    const forms = pluralForms("residence", "residences");
    expect(plural(1, forms, "en-US")).toBe("residence");
    expect(plural(5, forms, "en-US")).toBe("residences");
  });
});

describe("joinPhrase", () => {
  it("keeps the capital only at the start of the phrase", () => {
    expect(joinPhrase(["Этаж 7", "Свободно 4 из 6", "от 95 000 $", "открыть план"])).toBe(
      "Этаж 7, свободно 4 из 6, от 95 000 $, открыть план",
    );
    expect(joinPhrase(["Floor 7", "Sold out", null, "open plan"])).toBe("Floor 7, sold out, open plan");
  });

  it("leaves numbers, abbreviations and all-caps words as they are", () => {
    expect(lowerFirst("4 of 6 available")).toBe("4 of 6 available");
    expect(lowerFirst("Q4 2027")).toBe("Q4 2027");
    expect(lowerFirst("AURORA")).toBe("AURORA");
    expect(lowerFirst("Всё продано")).toBe("всё продано");
  });
});
