import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { adminKeys } from "./queries";
import { createRefreshBatch, REFRESH_BATCH_MS } from "./refresh-batch";

vi.mock("./session", () => ({ adminApi: {} }));

const keys = {
  me: adminKeys.me,
  dashboard: adminKeys.dashboard,
  list: adminKeys.residenceList({ search: "", floor: null }),
  floorList: adminKeys.residenceList({ search: "", floor: 7 }),
  card703: adminKeys.residenceCard("7.03"),
  card704: adminKeys.residenceCard("7.04"),
  card705: adminKeys.residenceCard("7.05"),
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

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("createRefreshBatch", () => {
  it("waits for the window, then marks the changed cards, the lists, the dashboard and the enquiries stale", () => {
    const queryClient = seededClient();
    const batch = createRefreshBatch(queryClient);
    batch.residence("7.03");
    batch.residence("7.04");
    vi.advanceTimersByTime(REFRESH_BATCH_MS - 1);
    expect(stale(queryClient)).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(stale(queryClient)).toEqual(["dashboard", "list", "floorList", "card703", "card704", "enquiryCard", "enquiryList"]);
  });

  it("marks every residence and enquiry query and the dashboard stale for everything, but not the session", async () => {
    const queryClient = seededClient();
    const done = createRefreshBatch(queryClient).everything();
    await vi.advanceTimersByTimeAsync(REFRESH_BATCH_MS);
    await done;
    expect(stale(queryClient)).toEqual(Object.keys(keys).filter((name) => name !== "me"));
  });

  it("leaves no timer behind when cancelled and still marks the gathered queries stale", () => {
    const queryClient = seededClient();
    const batch = createRefreshBatch(queryClient);
    batch.residence("7.05");
    batch.cancel();
    expect(vi.getTimerCount()).toBe(0);
    expect(stale(queryClient)).toContain("card705");
  });
});
