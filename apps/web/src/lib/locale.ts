import { preferenceCookie, readCookie } from "./cookies";

export const LOCALES = ["en", "ru"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "lang";

export function parseLocale(value: string | null | undefined): Locale {
  return LOCALES.find((locale) => locale === value) ?? DEFAULT_LOCALE;
}

export const localeCookie = (locale: Locale) => preferenceCookie(LOCALE_COOKIE, locale);

/** Reads the choice from a Cookie header or document.cookie; anything unknown falls back to English. */
export const localeFromCookies = (cookieHeader: string | null | undefined): Locale =>
  parseLocale(readCookie(cookieHeader, LOCALE_COOKIE));
