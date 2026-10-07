import type { QueryClient, QueryKey } from "@tanstack/react-query";

export const REFRESH_BATCH_MS = 150;

type Batch = {
  numbers: Set<string>;
  everything: boolean;
  timer: ReturnType<typeof setTimeout>;
  done: Promise<void>;
  finish: () => void;
};

/** Follows the shape of adminKeys: dashboard, enquiries/*, residences/list/*, residences/card/<number>. */
function isAffected(key: QueryKey, { numbers, everything }: Pick<Batch, "numbers" | "everything">) {
  if (key[0] !== "admin") return false;
  const [, area, kind, value] = key;
  if (area === "dashboard" || area === "enquiries") return true;
  if (area !== "residences") return false;
  return everything || kind === "list" || (kind === "card" && typeof value === "string" && numbers.has(value));
}

/**
 * Live events, the resync after a reconnect and the admin's own saves all ask for fresh data.
 * They are gathered for a short window and applied with a single invalidateQueries call, so an
 * active query matched by several of them is read once per window, not once per request.
 */
export function createRefreshBatch(queryClient: QueryClient, windowMs = REFRESH_BATCH_MS) {
  let current: Batch | null = null;

  function apply(refetchType: "active" | "none") {
    const batch = current;
    if (!batch) return;
    current = null;
    clearTimeout(batch.timer);
    queryClient
      .invalidateQueries({ predicate: (query) => isAffected(query.queryKey, batch), refetchType })
      .then(batch.finish, batch.finish);
  }

  function join(): Batch {
    if (current) return current;
    let finish = () => {};
    const done = new Promise<void>((resolve) => (finish = resolve));
    current = { numbers: new Set(), everything: false, timer: setTimeout(() => apply("active"), windowMs), done, finish };
    return current;
  }

  return {
    residence(number: string) {
      join().numbers.add(number);
    },
    /** Resolves once the affected active queries have been read again. */
    everything() {
      const batch = join();
      batch.everything = true;
      return batch.done;
    },
    /** Leaving the admin: no timer outlives it, the gathered queries are only marked stale. */
    cancel() {
      apply("none");
    },
  };
}

export type RefreshBatch = ReturnType<typeof createRefreshBatch>;

const batches = new WeakMap<QueryClient, RefreshBatch>();

/** Live sync and mutations of one cache share a batch, otherwise they could not merge. */
export function refreshBatchFor(queryClient: QueryClient) {
  let batch = batches.get(queryClient);
  if (!batch) {
    batch = createRefreshBatch(queryClient);
    batches.set(queryClient, batch);
  }
  return batch;
}
