export const ADMIN_HOME = "/admin";
export const ADMIN_LOGIN = "/admin/login";

export const adminHref = {
  dashboard: ADMIN_HOME,
  residences: "/admin/residences",
  enquiries: "/admin/enquiries",
  enquiry: (id: number) => `/admin/enquiries/${id}`,
};

const PROBE_ORIGIN = "http://admin.invalid";

/**
 * The page to return to after sign-in. Only an internal /admin path passes, so a crafted
 * ?next= cannot send the manager to another site ("//evil.com", "/\evil.com", "https://...").
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return ADMIN_HOME;
  let url: URL;
  try {
    url = new URL(raw, PROBE_ORIGIN);
  } catch {
    return ADMIN_HOME;
  }
  if (url.origin !== PROBE_ORIGIN) return ADMIN_HOME;
  const isAdmin = url.pathname === ADMIN_HOME || url.pathname.startsWith(`${ADMIN_HOME}/`);
  if (!isAdmin || url.pathname === ADMIN_LOGIN) return ADMIN_HOME;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function loginHref(next?: string) {
  const target = safeNextPath(next);
  return target === ADMIN_HOME ? ADMIN_LOGIN : `${ADMIN_LOGIN}?next=${encodeURIComponent(target)}`;
}
