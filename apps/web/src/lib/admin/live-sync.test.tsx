// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { invalidateAllResidences, invalidateResidence, useAdminLiveSync } from "./live-sync";
import { adminKeys } from "./queries";

vi.mock("./session", () => ({ adminApi: {} }));

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

const keys = {
  me: adminKeys.me,
  dashboard: adminKeys.dashboard,
  list: adminKeys.residenceList({ search: "", floor: null }),
  floorList: adminKeys.residenceList({ search: "", floor: 7 }),
  card703: adminKeys.residenceCard("7.03"),
  card704: adminKeys.residenceCard("7.04"),
  enquiryCard: adminKeys.enquiryCard(3),
  enquiryList: adminKeys.enquiryList("/api/admin/enquiries"),
};

function seededClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  for (const key of Object.values(keys)) queryClient.setQueryData(key, {});
  return queryClient;
}

const stale = (queryClient: QueryClient) =>
  Object.entries(keys)
    .filter(([, key]) => queryClient.getQueryState(key)?.isInvalidated)
    .map(([name]) => name);

describe("invalidateResidence", () => {
  it("marks the residence card, the lists, the dashboard and the enquiries stale, nothing else", async () => {
    const queryClient = seededClient();
    await invalidateResidence(queryClient, "7.03");
    expect(stale(queryClient)).toEqual(["dashboard", "list", "floorList", "card703", "enquiryCard", "enquiryList"]);
  });
});

describe("invalidateAllResidences", () => {
  it("marks every residence and enquiry query and the dashboard stale, but not the session", async () => {
    const queryClient = seededClient();
    await invalidateAllResidences(queryClient);
    expect(stale(queryClient)).toEqual(Object.keys(keys).filter((name) => name !== "me"));
  });
});

describe("useAdminLiveSync", () => {
  beforeAll(() => vi.stubGlobal("WebSocket", FakeSocket));
  afterAll(() => vi.unstubAllGlobals());

  it("invalidates by the residence in each update and everything after a reconnect", () => {
    vi.useFakeTimers();
    const queryClient = seededClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { unmount } = renderHook(() => useAdminLiveSync(), { wrapper });
    const socket = () => FakeSocket.all[FakeSocket.all.length - 1];
    act(() => socket().onopen?.());

    act(() =>
      socket().onmessage?.({
        data: JSON.stringify({
          type: "residence.updated",
          residence: { number: "7.04", floor: 7, status: "SOLD", priceUsd: 226000, updatedAt: "2026-10-07T09:12:00.000Z" },
        }),
      }),
    );
    expect(stale(queryClient)).toContain("card704");
    expect(stale(queryClient)).not.toContain("card703");

    act(() => socket().onclose?.());
    act(() => vi.advanceTimersByTime(1200));
    act(() => socket().onopen?.());
    expect(stale(queryClient)).toContain("card703");

    unmount();
    vi.useRealTimers();
  });
});
