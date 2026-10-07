import { describe, expect, it } from "vitest";

import { currencyCookie, currencyFromCookies } from "./currency-cookie";

describe("currencyCookie", () => {
  it("keeps the choice site-wide for a year with SameSite=Lax", () => {
    expect(currencyCookie("EUR")).toBe("currency=EUR; Path=/; Max-Age=31536000; SameSite=Lax");
  });
});

describe("currencyFromCookies", () => {
  it("reads the currency among other cookies", () => {
    expect(currencyFromCookies("theme=dark; currency=KZT; other=1")).toBe("KZT");
  });

  it("does not confuse a cookie with a similar name", () => {
    expect(currencyFromCookies("xcurrency=EUR")).toBe("USD");
  });

  it("falls back to USD when the cookie is missing or unknown", () => {
    expect(currencyFromCookies(undefined)).toBe("USD");
    expect(currencyFromCookies("")).toBe("USD");
    expect(currencyFromCookies("currency=GBP")).toBe("USD");
    expect(currencyFromCookies("currency=")).toBe("USD");
  });
});
