import { describe, expect, it } from "vitest";

import { convertUsd, formatMoney, parseCurrency, type CurrencyRates } from "./money";

const RATES: CurrencyRates = { USD: 1, EUR: 0.92, KZT: 505 };

describe("formatMoney", () => {
  it("shows residence 7.03 in all three currencies", () => {
    expect(formatMoney(218_000, { currency: "USD", rates: RATES })).toBe("$218,000");
    expect(formatMoney(218_000, { currency: "EUR", rates: RATES })).toBe("€200,560");
    expect(formatMoney(218_000, { currency: "KZT", rates: RATES })).toBe("₸110,090,000");
  });

  it("shows the floor 7 starting price in all three currencies", () => {
    expect(formatMoney(95_000, { currency: "USD", rates: RATES })).toBe("$95,000");
    expect(formatMoney(95_000, { currency: "EUR", rates: RATES })).toBe("€87,400");
    expect(formatMoney(95_000, { currency: "KZT", rates: RATES })).toBe("₸47,975,000");
  });

  it("rounds to whole units after converting", () => {
    expect(convertUsd(6_358, { currency: "EUR", rates: RATES })).toBe(5_849);
    expect(formatMoney(6_358, { currency: "EUR", rates: RATES })).toBe("€5,849");
    expect(formatMoney(2_589.07, { currency: "USD", rates: RATES })).toBe("$2,589");
    expect(formatMoney(0.5, { currency: "EUR", rates: RATES })).toBe("€0");
  });

  it("stays in dollars when the rate for the chosen currency is missing", () => {
    expect(formatMoney(218_000, { currency: "EUR", rates: {} })).toBe("$218,000");
  });

  it("takes the locale as a parameter", () => {
    expect(formatMoney(218_000, { currency: "EUR", rates: RATES, locale: "ru-RU" })).toBe("200\u00a0560\u00a0€");
  });
});

describe("parseCurrency", () => {
  it("accepts the three codes in any case", () => {
    expect(parseCurrency("EUR")).toBe("EUR");
    expect(parseCurrency("kzt")).toBe("KZT");
  });

  it("falls back to USD for unknown or missing values", () => {
    expect(parseCurrency("GBP")).toBe("USD");
    expect(parseCurrency("")).toBe("USD");
    expect(parseCurrency(undefined)).toBe("USD");
    expect(parseCurrency(null)).toBe("USD");
  });
});
