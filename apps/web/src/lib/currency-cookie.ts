import { preferenceCookie, readCookie } from "./cookies";
import { parseCurrency, type Currency } from "./money";

export const CURRENCY_COOKIE = "currency";

export const currencyCookie = (currency: Currency) => preferenceCookie(CURRENCY_COOKIE, currency);

/** Reads the choice from a Cookie header or document.cookie; anything unknown falls back to USD. */
export const currencyFromCookies = (cookieHeader: string | null | undefined): Currency =>
  parseCurrency(readCookie(cookieHeader, CURRENCY_COOKIE));
