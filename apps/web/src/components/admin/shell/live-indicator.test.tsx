// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { getAdminDictionary } from "@/content/en-admin";
import { useLiveEvents } from "@/lib/live/use-live";

import { LiveIndicator } from "./live-indicator";

const t = getAdminDictionary();

class FakeSocket {
  static all: FakeSocket[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  constructor() {
    FakeSocket.all.push(this);
  }
  close() {}
}

function Listener() {
  useLiveEvents({});
  return null;
}

beforeAll(() => vi.stubGlobal("WebSocket", FakeSocket));
afterAll(() => vi.unstubAllGlobals());

describe("LiveIndicator", () => {
  it("stays empty while connecting, then shows live and offline states", () => {
    vi.useFakeTimers();
    render(
      <>
        <Listener />
        <LiveIndicator t={t.live} />
      </>,
    );
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");

    act(() => FakeSocket.all[0].onopen?.());
    expect(status.textContent).toBe(t.live.open);

    act(() => FakeSocket.all[0].onclose?.());
    expect(status.textContent).toBe(t.live.offline);

    act(() => vi.advanceTimersByTime(1200));
    act(() => FakeSocket.all[1].onopen?.());
    expect(status.textContent).toBe(t.live.open);
    vi.useRealTimers();
  });
});
