import { describe, expect, it } from "vitest";

import { localeCookie, localeFromCookies, parseLocale } from "./locale";

describe("localeCookie", () => {
  it("keeps the choice site-wide for a year with SameSite=Lax", () => {
    expect(localeCookie("ru")).toBe("lang=ru; Path=/; Max-Age=31536000; SameSite=Lax");
  });
});

describe("localeFromCookies", () => {
  it("reads the language among other cookies", () => {
    expect(localeFromCookies("currency=EUR; lang=ru; theme=dark")).toBe("ru");
  });

  it("does not confuse a cookie with a similar name", () => {
    expect(localeFromCookies("xlang=ru")).toBe("en");
  });

  it("falls back to English when the cookie is missing or unknown", () => {
    expect(localeFromCookies(undefined)).toBe("en");
    expect(localeFromCookies("lang=de")).toBe("en");
    expect(localeFromCookies("lang=RU")).toBe("en");
    expect(localeFromCookies("lang=")).toBe("en");
  });
});

describe("parseLocale", () => {
  it("accepts only en and ru", () => {
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("ru")).toBe("ru");
    expect(parseLocale("ru-RU")).toBe("en");
    expect(parseLocale(null)).toBe("en");
  });
});
