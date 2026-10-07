import { parseCurrency, type Currency } from "./money";

export const CURRENCY_COOKIE = "currency";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function currencyCookie(currency: Currency) {
  return `${CURRENCY_COOKIE}=${currency}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

/** Reads the choice from a Cookie header or document.cookie; anything unknown falls back to USD. */
export function currencyFromCookies(cookieHeader: string | null | undefined): Currency {
  const entry = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CURRENCY_COOKIE}=`));
  return parseCurrency(entry?.slice(CURRENCY_COOKIE.length + 1));
}
