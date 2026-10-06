import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createAdminApi, REFRESH_PATH, SessionExpiredError } from "./api-client";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const bearer = (init: RequestInit | undefined) => new Headers(init?.headers).get("Authorization");

type Route = (init: RequestInit | undefined) => Response | Promise<Response>;

/** Fake API: the protected path accepts only the token in `valid.token`. */
function setup({ refresh, valid = { token: "fresh" } }: { refresh: Route; valid?: { token: string } }) {
  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) === REFRESH_PATH) return refresh(init);
    return bearer(init) === `Bearer ${valid.token}` ? json(200, { ok: true }) : json(401, { message: "Unauthorized" });
  });
  const onSessionExpired = vi.fn();
  const api = createAdminApi({ fetchImpl, onSessionExpired });
  const calls = (path: string) => fetchImpl.mock.calls.filter(([input]) => String(input) === path);
  return { api, fetchImpl, onSessionExpired, calls };
}

describe("admin API client", () => {
  it("sends the access token as a Bearer header", async () => {
    const { api, fetchImpl } = setup({ refresh: () => json(500, {}), valid: { token: "abc" } });
    api.setAccessToken("abc");

    const response = await api.request("/api/admin/dashboard");

    expect(response.status).toBe(200);
    expect(bearer(fetchImpl.mock.calls[0][1])).toBe("Bearer abc");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("refreshes once on 401 and repeats the request with the new token", async () => {
    const { api, calls } = setup({ refresh: () => json(200, { accessToken: "fresh" }) });
    api.setAccessToken("stale");

    const data = await api.getJson("/api/admin/dashboard", z.object({ ok: z.boolean() }));

    expect(data).toEqual({ ok: true });
    expect(calls(REFRESH_PATH)).toHaveLength(1);
    const attempts = calls("/api/admin/dashboard").map(([, init]) => bearer(init));
    expect(attempts).toEqual(["Bearer stale", "Bearer fresh"]);
  });

  it("lets parallel 401 answers wait for one shared refresh", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    const { api, calls } = setup({
      refresh: async () => {
        await gate;
        return json(200, { accessToken: "fresh" });
      },
    });
    api.setAccessToken("stale");

    const pending = Promise.all([
      api.request("/api/admin/dashboard"),
      api.request("/api/admin/residences"),
      api.request("/api/auth/me"),
    ]);
    await vi.waitFor(() => expect(calls(REFRESH_PATH)).toHaveLength(1));
    release();
    const responses = await pending;

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    expect(calls(REFRESH_PATH)).toHaveLength(1);
  });

  it("reports an expired session once when the refresh fails", async () => {
    const { api, onSessionExpired, calls } = setup({ refresh: () => json(401, { message: "Unauthorized" }) });
    api.setAccessToken("stale");

    const results = await Promise.allSettled([api.request("/api/admin/dashboard"), api.request("/api/auth/me")]);

    expect(results.every((result) => result.status === "rejected" && result.reason instanceof SessionExpiredError)).toBe(
      true,
    );
    expect(calls(REFRESH_PATH)).toHaveLength(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(api.hasAccessToken()).toBe(false);
  });

  it("treats a network error during refresh as no session", async () => {
    const { api, onSessionExpired } = setup({
      refresh: () => {
        throw new TypeError("Failed to fetch");
      },
    });

    await expect(api.request("/api/admin/dashboard")).rejects.toBeInstanceOf(SessionExpiredError);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("does not loop when the repeated request is rejected again", async () => {
    const { api, onSessionExpired, calls } = setup({
      refresh: () => json(200, { accessToken: "fresh" }),
      valid: { token: "never" },
    });

    await expect(api.request("/api/admin/dashboard")).rejects.toBeInstanceOf(SessionExpiredError);
    expect(calls("/api/admin/dashboard")).toHaveLength(2);
    expect(calls(REFRESH_PATH)).toHaveLength(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("restores a session silently and keeps the token out of web storage", async () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    vi.stubGlobal("sessionStorage", { setItem });
    const { api } = setup({ refresh: () => json(200, { accessToken: "fresh" }) });

    await expect(api.refresh()).resolves.toBe("fresh");
    expect(api.hasAccessToken()).toBe(true);
    expect(setItem).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("forgets the token on logout even if the request fails", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const api = createAdminApi({ fetchImpl, onSessionExpired: vi.fn() });
    api.setAccessToken("abc");

    await expect(api.logout()).rejects.toThrow();
    expect(api.hasAccessToken()).toBe(false);
  });
});
