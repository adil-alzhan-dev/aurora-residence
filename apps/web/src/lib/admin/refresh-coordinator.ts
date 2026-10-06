import { z } from "zod";

const LOCK_NAME = "aurora-admin-refresh";
const CHANNEL_NAME = "aurora-admin-session";
/** Holds only the id of the last refresh, never a token. */
const MARKER_KEY = "aurora-admin-refresh-id";
const WAIT_MS = 3_000;

type LockManagerLike = { request<T>(name: string, callback: () => Promise<T>): Promise<T> };
type ChannelLike = {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
};
type StorageLike = Pick<Storage, "getItem" | "setItem">;

const messageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("token"), id: z.string(), token: z.string().min(1) }),
  z.object({ type: z.literal("refreshing") }),
]);

type TokenMessage = { id: string; token: string };
export type TokenRequest = () => Promise<string | null>;

export type RefreshCoordinatorDeps = {
  locks?: LockManagerLike | null;
  channel?: ChannelLike | null;
  storage?: StorageLike | null;
  onToken: (token: string) => void;
  waitMs?: number;
};

export type RefreshCoordinator = { refresh(request: TokenRequest): Promise<string | null> };

/**
 * Tabs share one refresh cookie, and the API rotates it on every refresh, so two tabs
 * refreshing with the same cookie would sign one of them out. Refreshes run one at a time
 * under a Web Lock; the tab that refreshed sends the new access token to the others, and a
 * tab that waited for the lock takes that token instead of refreshing again.
 */
export function createRefreshCoordinator({
  locks = null,
  channel = null,
  storage = null,
  onToken,
  waitMs = WAIT_MS,
}: RefreshCoordinatorDeps): RefreshCoordinator {
  let latest: TokenMessage | null = null;
  let remoteRefreshAt = 0;
  const waiters = new Set<(message: TokenMessage) => void>();

  channel?.addEventListener("message", (event) => {
    const parsed = messageSchema.safeParse(event.data);
    if (!parsed.success) return;
    if (parsed.data.type === "refreshing") {
      remoteRefreshAt = Date.now();
      return;
    }
    const { id, token } = parsed.data;
    latest = { id, token };
    remoteRefreshAt = 0;
    onToken(token);
    for (const waiter of waiters) waiter(latest);
  });

  function readMarker() {
    try {
      return storage?.getItem(MARKER_KEY) ?? null;
    } catch {
      return null;
    }
  }

  function writeMarker(id: string) {
    try {
      storage?.setItem(MARKER_KEY, id);
    } catch {
      // Without storage the next tab simply refreshes on its own, which is still safe.
    }
  }

  function waitForToken(accept: (message: TokenMessage) => boolean): Promise<string | null> {
    return new Promise((resolve) => {
      const waiter = (message: TokenMessage) => {
        if (!accept(message)) return;
        finish(message.token);
      };
      const timer = setTimeout(() => finish(null), waitMs);
      function finish(token: string | null) {
        clearTimeout(timer);
        waiters.delete(waiter);
        resolve(token);
      }
      waiters.add(waiter);
    });
  }

  async function refreshHere(request: TokenRequest) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const token = await request();
    if (token) {
      writeMarker(id);
      channel?.postMessage({ type: "token", id, token });
    }
    return token;
  }

  function withLock(lockManager: LockManagerLike, request: TokenRequest) {
    const markerBefore = readMarker();
    return lockManager.request(LOCK_NAME, async () => {
      const marker = readMarker();
      if (marker && marker !== markerBefore) {
        const shared = latest?.id === marker ? latest.token : await waitForToken((message) => message.id === marker);
        if (shared) return shared;
      }
      return refreshHere(request);
    });
  }

  async function withChannelOnly(request: TokenRequest) {
    if (Date.now() - remoteRefreshAt < waitMs) {
      const shared = await waitForToken(() => true);
      if (shared) return shared;
    }
    const startedAt = Date.now();
    const before = latest;
    channel?.postMessage({ type: "refreshing" });
    const token = await refreshHere(request);
    if (token) return token;
    // Both tabs refreshed at once and the other one won: its token is on the way.
    if (latest !== before) return latest?.token ?? null;
    return remoteRefreshAt >= startedAt ? waitForToken(() => true) : null;
  }

  return {
    refresh(request) {
      if (locks) return withLock(locks, request);
      if (channel) return withChannelOnly(request);
      return request();
    },
  };
}

export function browserRefreshCoordinator(onToken: (token: string) => void): RefreshCoordinator {
  const locks = typeof navigator !== "undefined" && navigator.locks ? navigator.locks : null;
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;
  let storage: StorageLike | null = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  return createRefreshCoordinator({ locks, channel, storage, onToken });
}
