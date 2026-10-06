import { describe, expect, it } from "vitest";

import { loginHref, safeNextPath } from "./paths";

describe("safeNextPath", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/enquiries?status=NEW", "/admin/enquiries?status=NEW"],
    ["/admin/residences/7.03#history", "/admin/residences/7.03#history"],
  ])("keeps the internal admin path %s", (raw, expected) => {
    expect(safeNextPath(raw)).toBe(expected);
  });

  it.each([
    null,
    "",
    "https://evil.example/admin",
    "//evil.example/admin",
    "/\\evil.example",
    "/admin/../residences",
    "/adminpanel",
    "/residences",
    "/admin/login",
    "javascript:alert(1)",
  ])("falls back to the dashboard for %s", (raw) => {
    expect(safeNextPath(raw)).toBe("/admin");
  });
});

const SITE = "https://aurora.example";

/** Where the browser would actually go if router.replace got this value. */
function landing(target: string) {
  const url = new URL(target, `${SITE}/admin/login`);
  return { origin: url.origin, pathname: url.pathname };
}

describe("safeNextPath against encoded and look-alike separators", () => {
  it.each([
    "/%2F%2Fevil.example",
    "/%2f%2fevil.example/admin",
    "%2F%2Fevil.example",
    "/%5C%5Cevil.example",
    "/%5Cevil.example",
    "/%2F%5Cevil.example",
    "/admin/%2e%2e/residences",
    "/admin/%2E%2E/%2E%2E/evil.example",
    "/admin/.%2e/residences",
    "/admin/%2e./residences",
    "/%252F%252Fevil.example",
    "/%25252F%25252Fevil.example",
    "/\u2215\u2215evil.example",
    "\u2215\u2215evil.example",
    "/\uFF0F\uFF0Fevil.example",
    "\uFF0F\uFF0Fevil.example",
    "/\u29F8evil.example",
    "/\uFE68evil.example",
    "\uFF3C\uFF3Cevil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "/\r/evil.example/admin",
    "/ /evil.example",
  ])("falls back to the dashboard for %j", (raw) => {
    expect(safeNextPath(raw)).toBe("/admin");
  });

  it.each([
    "/admin/%2F%2Fevil.example",
    "/admin/%5C%5Cevil.example",
    "/admin/..%2F..%2Fevil.example",
    "/admin/%252e%252e/%252e%252e/evil.example",
    "/admin/%252F%252Fevil.example",
    "/admin/\u2215\u2215evil.example",
    "/admin/\uFF0F\uFF0Fevil.example",
    "/admin/\u29F8\uFE68evil.example",
    "/admin//evil.example",
    "/admin/residences?next=//evil.example#//evil.example",
  ])("keeps %j on this site inside /admin", (raw) => {
    const target = safeNextPath(raw);
    const { origin, pathname } = landing(target);

    expect(origin).toBe(SITE);
    expect(pathname === "/admin" || pathname.startsWith("/admin/")).toBe(true);
    expect(target.startsWith("//")).toBe(false);
  });

  it.each(["/admin/login/", "/admin/login//", "/admin/%6Cogin", "/admin/login%2F", "/admin/./login"])(
    "does not return to the sign-in page through %j",
    (raw) => {
      expect(safeNextPath(raw)).toBe("/admin");
    },
  );
});

describe("safeNextPath against repeated slashes before the sign-in page", () => {
  it.each([
    "/admin//login",
    "/admin///login/?next=/admin",
    "/admin//%6Cogin",
    "/admin//%2Flogin",
    "/admin/%2F/login",
    "/admin/%2F%2Flogin/",
    "/admin//%2F/%6Cogin//",
    "/admin/./%2Flogin",
  ])("falls back to the dashboard for %j", (raw) => {
    expect(safeNextPath(raw)).toBe("/admin");
  });

  it.each([
    ["/admin//enquiries", "/admin//enquiries"],
    ["/admin//login-history", "/admin//login-history"],
    ["/admin/residences//7.03", "/admin/residences//7.03"],
  ])("keeps the other admin page %j", (raw, expected) => {
    expect(safeNextPath(raw)).toBe(expected);
  });

  it("leaves the sign-in page out of loginHref", () => {
    expect(loginHref("/admin//login")).toBe("/admin/login");
  });
});

describe("loginHref", () => {
  it("adds the page to return to", () => {
    expect(loginHref("/admin/enquiries")).toBe("/admin/login?next=%2Fadmin%2Fenquiries");
  });

  it("leaves out the dashboard and unsafe targets", () => {
    expect(loginHref("/admin")).toBe("/admin/login");
    expect(loginHref("//evil.example")).toBe("/admin/login");
  });
});
