// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { useAdminLiveSync } from "./live-sync";
import { useDashboardSummary, useInvalidateAdminData } from "./queries";
import { adminApi } from "./session";

const fetchMock = vi.hoisted(() => vi.fn<typeof fetch>());

vi.mock("./session", async () => {
  const { createAdminApi } = await import("./api-client");
  return { adminApi: createAdminApi({ fetchImpl: fetchMock, onSessionExpired: () => {} }) };
});

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

const latestSocket = () => FakeSocket.all[FakeSocket.all.length - 1];

const dashboard = {
  residences: { AVAILABLE: 40, RESERVED: 4, SOLD: 20, total: 64 },
  enquiries: { total: 9, new: 2, newToday: 1 },
  facade: [],
  reservations: [],
  latestEnquiries: [],
};

const update = (number: string) => ({
  data: JSON.stringify({
    type: "residence.updated",
    residence: { number, floor: 7, status: "RESERVED", priceUsd: 218000, updatedAt: "2026-10-07T09:12:00.000Z" },
  }),
});

const dashboardRequests = () => fetchMock.mock.calls.filter(([input]) => input === "/api/admin/dashboard").length;

/** Longer than the batch window plus the refetch, so a second read would have started by then. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 400)));

async function renderAdmin() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const view = renderHook(
    () => {
      useAdminLiveSync();
      return { summary: useDashboardSummary(), invalidate: useInvalidateAdminData() };
    },
    { wrapper },
  );
  await waitFor(() => expect(view.result.current.summary.isSuccess).toBe(true));
  act(() => latestSocket().onopen?.());
  fetchMock.mockClear();
  getJson.mockClear();
  return view;
}

const getJson = vi.spyOn(adminApi, "getJson");

describe("useAdminLiveSync", () => {
  beforeAll(() => vi.stubGlobal("WebSocket", FakeSocket));
  afterAll(() => vi.unstubAllGlobals());
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => Response.json(dashboard));
  });

  it("reads the active dashboard once for ten updates in a row", async () => {
    const { unmount } = await renderAdmin();

    act(() => {
      for (let index = 1; index <= 10; index += 1) latestSocket().onmessage?.(update(`7.0${index % 6}`));
    });
    await settle();

    expect(getJson).toHaveBeenCalledTimes(1);
    expect(dashboardRequests()).toBe(1);
    unmount();
  });

  it("merges a resync after a reconnect into the batch it arrives in", async () => {
    const { unmount } = await renderAdmin();
    const before = latestSocket();
    act(() => before.onclose?.());
    await waitFor(() => expect(latestSocket()).not.toBe(before), { timeout: 2000 });

    act(() => {
      latestSocket().onmessage?.(update("7.03"));
      latestSocket().onopen?.();
    });
    await settle();

    expect(dashboardRequests()).toBe(1);
    unmount();
  });

  it("reads once when the admin's own save and its live event arrive together", async () => {
    const { result, unmount } = await renderAdmin();

    await act(async () => {
      const saved = result.current.invalidate();
      latestSocket().onmessage?.(update("7.03"));
      await saved;
    });
    await settle();

    expect(dashboardRequests()).toBe(1);
    unmount();
  });

  it("sends nothing after unmount for updates still waiting in the batch", async () => {
    const { unmount } = await renderAdmin();
    act(() => latestSocket().onmessage?.(update("7.03")));
    unmount();
    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
