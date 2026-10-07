export const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** A site-wide preference cookie: readable by the server on the next request, kept for a year. */
export const preferenceCookie = (name: string, value: string) =>
  `${name}=${value}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;

/** Value of one cookie from a Cookie header or document.cookie. */
export function readCookie(cookieHeader: string | null | undefined, name: string) {
  const entry = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return entry?.slice(name.length + 1);
}
