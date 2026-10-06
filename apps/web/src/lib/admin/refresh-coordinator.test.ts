import { describe, expect, it, vi } from "vitest";

import { createAdminApi, REFRESH_PATH } from "./api-client";
import { createRefreshCoordinator, type RefreshCoordinatorDeps } from "./refresh-coordinator";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** Web Locks for one origin: callbacks for the same name run one after another. */
function fakeLocks() {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    request<T>(_name: string, callback: () => Promise<T>) {
      const run = tail.then(callback);
      tail = run.catch(() => undefined);
      return run;
    },
  };
}

/** BroadcastChannel between tabs: delivered later, never to the sender. */
function fakeBus() {
  const listeners: Array<{ owner: object; listener: (event: MessageEvent) => void }> = [];
  return () => {
    const owner = {};
    return {
      postMessage(message: unknown) {
        for (const entry of listeners) {
          if (entry.owner !== owner) setTimeout(() => entry.listener({ data: message } as MessageEvent), 0);
        }
      },
      addEventListener(_type: "message", listener: (event: MessageEvent) => void) {
        listeners.push({ owner, listener });
      },
    };
  };
}

/**
 * Two tabs of one browser: they share the refresh cookie, and the API accepts only the
 * latest cookie and rotates it, like POST /api/auth/refresh does.
 */
function browser({ withLocks, refreshDelayMs = 20 }: { withLocks: boolean; refreshDelayMs?: number }) {
  const server = { validCookie: 1, issued: 0 };
  const jar = { cookie: 1 };
  const locks = withLocks ? fakeLocks() : null;
  const storage = new Map<string, string>();
  const channel = fakeBus();

  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input) !== REFRESH_PATH) return json(404, {});
    const sent = jar.cookie;
    await new Promise((resolve) => setTimeout(resolve, refreshDelayMs));
    if (sent !== server.validCookie) return json(401, { message: "Session expired" });
    server.validCookie += 1;
    jar.cookie = server.validCookie;
    server.issued += 1;
    return json(200, { accessToken: `access-${server.issued}` });
  });

  function tab() {
    const onSessionExpired = vi.fn();
    const deps = (onToken: RefreshCoordinatorDeps["onToken"]) =>
      createRefreshCoordinator({
        locks,
        channel: channel(),
        storage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
        onToken,
        waitMs: 500,
      });
    const api = createAdminApi({ fetchImpl, onSessionExpired, coordinate: deps });
    return { api, onSessionExpired };
  }

  const refreshCalls = () => fetchImpl.mock.calls.filter(([input]) => String(input) === REFRESH_PATH).length;
  return { tab, refreshCalls };
}

describe("refresh shared between tabs", () => {
  it("refreshes once when two tabs need a new token at the same time", async () => {
    const { tab, refreshCalls } = browser({ withLocks: true });
    const first = tab();
    const second = tab();

    const tokens = await Promise.all([first.api.refresh(), second.api.refresh()]);

    expect(refreshCalls()).toBe(1);
    expect(tokens).toEqual(["access-1", "access-1"]);
    expect(first.onSessionExpired).not.toHaveBeenCalled();
    expect(second.onSessionExpired).not.toHaveBeenCalled();
  });

  it("refreshes again later with the rotated cookie", async () => {
    const { tab, refreshCalls } = browser({ withLocks: true });
    const first = tab();
    const second = tab();

    await Promise.all([first.api.refresh(), second.api.refresh()]);
    const later = await second.api.refresh();

    expect(refreshCalls()).toBe(2);
    expect(later).toBe("access-2");
  });

  it("gives the other tab the new token as soon as it is issued", async () => {
    const { tab } = browser({ withLocks: true });
    const first = tab();
    const second = tab();

    await first.api.refresh();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(second.api.hasAccessToken()).toBe(true);
  });

  it("without Web Locks a tab waits for the refresh another tab announced", async () => {
    const { tab, refreshCalls } = browser({ withLocks: false });
    const first = tab();
    const second = tab();

    const pending = first.api.refresh();
    await new Promise((resolve) => setTimeout(resolve, 1));
    const tokens = await Promise.all([pending, second.api.refresh()]);

    expect(refreshCalls()).toBe(1);
    expect(tokens).toEqual(["access-1", "access-1"]);
  });

  it("without Web Locks the tab that lost a simultaneous refresh takes the winner's token", async () => {
    const { tab } = browser({ withLocks: false });
    const first = tab();
    const second = tab();

    const tokens = await Promise.all([first.api.refresh(), second.api.refresh()]);

    expect(tokens).toEqual(["access-1", "access-1"]);
    expect(second.onSessionExpired).not.toHaveBeenCalled();
  });
});
