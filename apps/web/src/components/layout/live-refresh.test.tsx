// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LIVE_REFRESH_DELAY_MS, LiveRefresh } from "./live-refresh";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

class FakeSocket {
  static all: FakeSocket[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  constructor(readonly url: string) {
    FakeSocket.all.push(this);
  }
  close() {}
}

const latest = () => FakeSocket.all[FakeSocket.all.length - 1];
const update = (number: string, status: string) =>
  JSON.stringify({
    type: "residence.updated",
    residence: { number, floor: 7, status, priceUsd: 218000, updatedAt: "2026-10-07T09:12:00.000Z" },
  });

beforeAll(() => vi.stubGlobal("WebSocket", FakeSocket));
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => {
  vi.useFakeTimers();
  refresh.mockClear();
});

/** The tab keeps one client between tests, so a remount counts as a reconnect: settle that first. */
function mountOpen() {
  const view = render(<LiveRefresh />);
  act(() => latest().onopen?.());
  act(() => vi.advanceTimersByTime(LIVE_REFRESH_DELAY_MS));
  refresh.mockClear();
  return view;
}

describe("LiveRefresh", () => {
  it("connects to /socket on the page host", () => {
    const { unmount } = mountOpen();
    expect(latest().url).toBe("ws://localhost:3000/socket");
    unmount();
    vi.advanceTimersByTime(1000);
  });

  it("re-renders the server data once for a burst of updates", () => {
    const { unmount } = mountOpen();
    act(() => {
      latest().onmessage?.({ data: update("7.03", "RESERVED") });
      latest().onmessage?.({ data: update("7.03", "RESERVED") });
    });
    expect(refresh).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(LIVE_REFRESH_DELAY_MS));
    expect(refresh).toHaveBeenCalledTimes(1);

    act(() => latest().onmessage?.({ data: update("7.02", "SOLD") }));
    act(() => vi.advanceTimersByTime(LIVE_REFRESH_DELAY_MS));
    expect(refresh).toHaveBeenCalledTimes(2);
    unmount();
    vi.advanceTimersByTime(1000);
  });

  it("ignores frames that are not residence updates", () => {
    const { unmount } = mountOpen();
    act(() => latest().onmessage?.({ data: "{\"type\":\"hello\"}" }));
    act(() => vi.advanceTimersByTime(LIVE_REFRESH_DELAY_MS));
    expect(refresh).not.toHaveBeenCalled();
    unmount();
    vi.advanceTimersByTime(1000);
  });

  it("reads fresh data after the connection comes back", () => {
    const { unmount } = mountOpen();
    act(() => latest().onclose?.());
    act(() => vi.advanceTimersByTime(1200));
    act(() => latest().onopen?.());
    act(() => vi.advanceTimersByTime(LIVE_REFRESH_DELAY_MS));
    expect(refresh).toHaveBeenCalledTimes(1);
    unmount();
    vi.advanceTimersByTime(1000);
  });

  it("does not refresh after the page is gone", () => {
    const { unmount } = mountOpen();
    act(() => latest().onmessage?.({ data: update("7.03", "AVAILABLE") }));
    unmount();
    vi.advanceTimersByTime(LIVE_REFRESH_DELAY_MS);
    expect(refresh).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
  });
});
