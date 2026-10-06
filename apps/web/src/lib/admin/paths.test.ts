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

describe("loginHref", () => {
  it("adds the page to return to", () => {
    expect(loginHref("/admin/enquiries")).toBe("/admin/login?next=%2Fadmin%2Fenquiries");
  });

  it("leaves out the dashboard and unsafe targets", () => {
    expect(loginHref("/admin")).toBe("/admin/login");
    expect(loginHref("//evil.example")).toBe("/admin/login");
  });
});
