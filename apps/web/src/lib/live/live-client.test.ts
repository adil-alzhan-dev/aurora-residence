import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createLiveClient, liveSocketUrl, reconnectDelay } from "./live-client";

class FakeSocket {
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  closed = false;

  close() {
    this.closed = true;
  }
  open() {
    this.onopen?.(new Event("open"));
  }
  drop() {
    this.onerror?.(new Event("error"));
    this.onclose?.({} as CloseEvent);
  }
  send(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

const update = (number: string, status = "RESERVED") =>
  JSON.stringify({
    type: "residence.updated",
    residence: { number, floor: 7, status, priceUsd: 218000, updatedAt: "2026-10-07T09:12:00.000Z" },
  });

function setup() {
  const sockets: FakeSocket[] = [];
  const client = createLiveClient({
    url: "ws://localhost/socket",
    random: () => 0.5,
    createSocket: () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
  });
  const latest = () => sockets[sockets.length - 1];
  return { client, sockets, latest };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("reconnectDelay", () => {
  it("doubles from 1 s up to 30 s", () => {
    const middle = () => 0.5;
    expect([0, 1, 2, 3, 4, 5, 6, 10].map((attempt) => reconnectDelay(attempt, middle))).toEqual([
      1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000,
    ]);
  });

  it("spreads each pause by up to 20% and never above 30 s", () => {
    expect(reconnectDelay(0, () => 0)).toBe(800);
    expect(reconnectDelay(0, () => 1)).toBe(1200);
    expect(reconnectDelay(8, () => 1)).toBe(30000);
  });
});

describe("liveSocketUrl", () => {
  it("follows the page protocol", () => {
    expect(liveSocketUrl({ protocol: "http:", host: "localhost" })).toBe("ws://localhost/socket");
    expect(liveSocketUrl({ protocol: "https:", host: "aurora.example:8443" })).toBe("wss://aurora.example:8443/socket");
  });
});

describe("createLiveClient", () => {
  it("opens one socket for all subscribers and hands them parsed residences", () => {
    const { client, sockets, latest } = setup();
    const first = vi.fn();
    const second = vi.fn();
    client.subscribe({ onResidence: first });
    client.subscribe({ onResidence: second });
    latest().open();
    latest().send(update("7.03"));

    expect(sockets).toHaveLength(1);
    expect(client.getStatus()).toBe("open");
    expect(first).toHaveBeenCalledWith(expect.objectContaining({ number: "7.03", status: "RESERVED" }));
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("drops frames that are not residence updates", () => {
    const { client, latest } = setup();
    const onResidence = vi.fn();
    client.subscribe({ onResidence });
    latest().open();
    latest().send("garbage");
    latest().send(JSON.stringify({ type: "residence.updated", residence: { number: "7.03" } }));
    expect(onResidence).not.toHaveBeenCalled();
  });

  it("reconnects with a growing pause and reports the connection state", () => {
    const { client, sockets, latest } = setup();
    const statuses: string[] = [];
    client.subscribeStatus(() => statuses.push(client.getStatus()));
    client.subscribe({});
    latest().open();

    latest().drop();
    expect(client.getStatus()).toBe("closed");
    vi.advanceTimersByTime(999);
    expect(sockets).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(sockets).toHaveLength(2);

    latest().drop();
    vi.advanceTimersByTime(1999);
    expect(sockets).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(sockets).toHaveLength(3);

    latest().open();
    expect(statuses).toEqual(["open", "closed", "open"]);
  });

  it("starts the pause from 1 s again after a successful reconnect", () => {
    const { client, sockets, latest } = setup();
    client.subscribe({});
    latest().drop();
    vi.advanceTimersByTime(1000);
    latest().drop();
    vi.advanceTimersByTime(2000);
    latest().open();
    latest().drop();
    vi.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(4);
  });

  it("asks to read fresh data once after a reconnect, not on the first open", () => {
    const { client, latest } = setup();
    const onResync = vi.fn();
    client.subscribe({ onResync });
    latest().open();
    expect(onResync).not.toHaveBeenCalled();

    latest().drop();
    vi.advanceTimersByTime(1000);
    latest().drop();
    vi.advanceTimersByTime(2000);
    expect(onResync).not.toHaveBeenCalled();
    latest().open();
    expect(onResync).toHaveBeenCalledTimes(1);
  });

  it("asks to read fresh data when the first connection only succeeds on a retry", () => {
    const { client, latest } = setup();
    const onResync = vi.fn();
    client.subscribe({ onResync });
    latest().drop();
    vi.advanceTimersByTime(1000);
    latest().open();
    expect(onResync).toHaveBeenCalledTimes(1);
  });

  it("keeps retrying when the socket cannot even be created", () => {
    let calls = 0;
    const client = createLiveClient({
      url: "ws://localhost/socket",
      random: () => 0.5,
      createSocket: () => {
        calls += 1;
        throw new SyntaxError("bad url");
      },
    });
    client.subscribe({});
    vi.advanceTimersByTime(1000 + 2000);
    expect(calls).toBe(3);
    expect(client.getStatus()).toBe("closed");
  });

  it("closes the socket and stops retrying shortly after the last subscriber leaves", () => {
    const { client, sockets, latest } = setup();
    const unsubscribe = client.subscribe({});
    latest().open();
    unsubscribe();
    expect(latest().closed).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(latest().closed).toBe(true);
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
  });

  it("keeps the socket when a new subscriber arrives within the grace period", () => {
    const { client, sockets, latest } = setup();
    const unsubscribe = client.subscribe({});
    latest().open();
    unsubscribe();
    client.subscribe({});
    vi.advanceTimersByTime(5000);
    expect(sockets).toHaveLength(1);
    expect(latest().closed).toBe(false);
  });
});
