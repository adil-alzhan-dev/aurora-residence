// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { adminKeys, useDashboardSummary } from "./queries";

const fetchMock = vi.hoisted(() => vi.fn<typeof fetch>());
const onSessionExpired = vi.hoisted(() => vi.fn());

vi.mock("./session", async () => {
  const { createAdminApi } = await import("./api-client");
  return { adminApi: createAdminApi({ fetchImpl: fetchMock, onSessionExpired }) };
});

/** A fetch that never answers on its own and fails the way the browser does when aborted. */
function hangingFetch(_input: RequestInfo | URL, init?: RequestInit) {
  return new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  });
}

describe("admin queries", () => {
  it("abort the HTTP request when React Query cancels the query, without refresh or error", async () => {
    fetchMock.mockImplementation(hangingFetch);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useDashboardSummary(), { wrapper });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await queryClient.cancelQueries({ queryKey: adminKeys.dashboard });

    const signal = fetchMock.mock.calls[0][1]?.signal;
    expect(signal?.aborted).toBe(true);
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).not.toHaveBeenCalled();
  });
});
