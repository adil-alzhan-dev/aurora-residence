import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAdminApi, LOGOUT_PATH, REFRESH_PATH } from "./api-client";
import { createRefreshCoordinator } from "./refresh-coordinator";

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

/** BroadcastChannel between tabs: delivered later, never to the sender; keeps every message sent. */
function fakeBus() {
  const listeners: Array<{ owner: object; listener: (event: MessageEvent) => void }> = [];
  const sent: unknown[] = [];
  const endpoint = () => {
    const owner = {};
    return {
      postMessage(message: unknown) {
        sent.push(message);
        for (const entry of listeners) {
          if (entry.owner !== owner) setTimeout(() => entry.listener({ data: message } as MessageEvent), 0);
        }
      },
      addEventListener(_type: "message", listener: (event: MessageEvent) => void) {
        listeners.push({ owner, listener });
      },
    };
  };
  return { endpoint, sent };
}

/** How long each refresh request takes, in call order; "hang" never answers and never reaches the API. */
type Timing = number | "hang";

/**
 * Tabs of one browser: they share the refresh cookie, and the API accepts only the latest
 * cookie and rotates it as soon as the request arrives, like POST /api/auth/refresh does.
 * The new cookie reaches the browser only with the response.
 */
function browser({ withLocks, timings = [] }: { withLocks: boolean; timings?: Timing[] }) {
  const server = { validCookie: 1, issued: 0 };
  const jar = { cookie: 1 };
  const locks = withLocks ? fakeLocks() : null;
  const bus = fakeBus();
  let refreshes = 0;

  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input) === LOGOUT_PATH) return new Response(null, { status: 204 });
    if (String(input) !== REFRESH_PATH) return json(404, {});
    const timing = timings[refreshes] ?? 20;
    refreshes += 1;
    if (timing === "hang") return new Promise<Response>(() => undefined);
    const sent = jar.cookie;
    const accepted = sent === server.validCookie;
    if (accepted) {
      server.validCookie += 1;
      server.issued += 1;
    }
    const cookie = server.validCookie;
    const token = `access-${server.issued}`;
    await new Promise((resolve) => setTimeout(resolve, timing));
    if (!accepted) return json(401, { message: "Session expired" });
    jar.cookie = cookie;
    return json(200, { accessToken: token });
  });

  function tab() {
    const onSessionExpired = vi.fn();
    const coordinator = createRefreshCoordinator({ locks, channel: bus.endpoint() });
    const api = createAdminApi({ fetchImpl, onSessionExpired, coordinator });
    return { api, onSessionExpired };
  }

  return { tab, refreshCalls: () => refreshes, messages: bus.sent, otherContext: bus.endpoint };
}

function track<T>(promise: Promise<T>) {
  const state: { settled: boolean; value?: T } = { settled: false };
  void promise.then((value) => Object.assign(state, { settled: true, value }));
  return state;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("refresh shared between tabs with Web Locks", () => {
  it("refreshes one tab after another, each with the cookie the previous one left", async () => {
    const { tab, refreshCalls } = browser({ withLocks: true });
    const first = tab();
    const second = tab();

    const both = Promise.all([first.api.refresh(), second.api.refresh()]);
    await vi.advanceTimersByTimeAsync(100);

    expect(await both).toEqual(["access-1", "access-2"]);
    expect(refreshCalls()).toBe(2);
    expect(first.onSessionExpired).not.toHaveBeenCalled();
    expect(second.onSessionExpired).not.toHaveBeenCalled();
  });

  it("keeps each tab's token to itself", async () => {
    const { tab } = browser({ withLocks: true });
    const first = tab();
    const second = tab();

    const pending = first.api.refresh();
    await vi.advanceTimersByTimeAsync(100);
    await pending;

    expect(first.api.hasAccessToken()).toBe(true);
    expect(second.api.hasAccessToken()).toBe(false);
  });
});

describe("refresh shared between tabs without Web Locks", () => {
  it("waits for a slow refresh of another tab, then refreshes with the rotated cookie", async () => {
    const { tab, refreshCalls } = browser({ withLocks: false, timings: [6_500, 20] });
    const first = tab();
    const second = tab();

    const firstToken = track(first.api.refresh());
    await vi.advanceTimersByTimeAsync(1);
    const secondToken = track(second.api.refresh());

    await vi.advanceTimersByTimeAsync(6_000);
    expect(secondToken.settled).toBe(false);
    expect(refreshCalls()).toBe(1);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(firstToken.value).toBe("access-1");
    expect(secondToken.value).toBe("access-2");
    expect(second.onSessionExpired).not.toHaveBeenCalled();
  });

  it("after an early 401 waits for the delayed 200 of the tab that won, then refreshes again", async () => {
    const { tab } = browser({ withLocks: false, timings: [6_500, 20, 20] });
    const first = tab();
    const second = tab();

    const firstToken = track(first.api.refresh());
    const secondToken = track(second.api.refresh());

    await vi.advanceTimersByTimeAsync(3_500);
    expect(secondToken.settled).toBe(false);

    await vi.advanceTimersByTimeAsync(3_500);
    expect(firstToken.value).toBe("access-1");
    expect(secondToken.value).toBe("access-2");
    expect(second.onSessionExpired).not.toHaveBeenCalled();
  });

  it("refreshes on its own once a tab that vanished mid-refresh runs out of time", async () => {
    const { tab, refreshCalls } = browser({ withLocks: false, timings: ["hang", 20] });
    const vanished = tab();
    const second = tab();

    void vanished.api.refresh();
    await vi.advanceTimersByTimeAsync(1);
    const secondToken = track(second.api.refresh());

    await vi.advanceTimersByTimeAsync(14_000);
    expect(secondToken.settled).toBe(false);
    expect(refreshCalls()).toBe(1);

    await vi.advanceTimersByTimeAsync(1_100);
    expect(secondToken.value).toBe("access-1");
    expect(second.onSessionExpired).not.toHaveBeenCalled();
  });
});

describe("session messages between tabs", () => {
  it.each([true, false])("never carry a token (Web Locks: %s)", async (withLocks) => {
    const { tab, messages } = browser({ withLocks, timings: [300, 20, 20] });
    const first = tab();
    const second = tab();

    const both = Promise.all([first.api.refresh(), second.api.refresh()]);
    await vi.advanceTimersByTimeAsync(1_000);
    const tokens = await both;

    expect(tokens.every(Boolean)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
    for (const message of messages) {
      expect(["type", "id", "ok"]).toEqual(expect.arrayContaining(Object.keys(message as object)));
      expect(JSON.stringify(message)).not.toContain("access-");
    }
  });

  it("arriving after logout do not bring the session back", async () => {
    const { tab, refreshCalls, otherContext } = browser({ withLocks: false });
    const current = tab();
    const other = otherContext();

    current.api.setAccessToken("access-0");
    await current.api.logout();
    other.postMessage({ type: "token", id: "late", token: "access-late" });
    other.postMessage({ type: "refresh-finished", id: "late", ok: true });
    await vi.advanceTimersByTimeAsync(100);

    expect(current.api.hasAccessToken()).toBe(false);
    expect(refreshCalls()).toBe(0);
  });

  it("a refresh still in flight at logout does not bring the session back", async () => {
    const { tab } = browser({ withLocks: true, timings: [500] });
    const current = tab();

    const token = track(current.api.refresh());
    await vi.advanceTimersByTimeAsync(1);
    await current.api.logout();
    await vi.advanceTimersByTimeAsync(600);

    expect(token.settled).toBe(true);
    expect(token.value).toBeNull();
    expect(current.api.hasAccessToken()).toBe(false);
  });
});
