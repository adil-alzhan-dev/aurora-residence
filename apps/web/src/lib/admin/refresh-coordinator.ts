import { z } from "zod";

import { REQUEST_TIMEOUT_MS } from "./api-client";

const LOCK_NAME = "aurora-admin-refresh";
const CHANNEL_NAME = "aurora-admin-session";

type LockManagerLike = { request<T>(name: string, callback: () => Promise<T>): Promise<T> };
type ChannelLike = {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
};

/** Channel messages carry no token: every tab gets its own access token from the API. */
const messageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("refresh-started"), id: z.string().min(1) }),
  z.object({ type: z.literal("refresh-finished"), id: z.string().min(1), ok: z.boolean() }),
]);

export type TokenRequest = () => Promise<string | null>;

export type RefreshCoordinatorDeps = {
  locks?: LockManagerLike | null;
  channel?: ChannelLike | null;
  /** How long a refresh announced by another tab may stay unfinished before it counts as gone. */
  remoteTimeoutMs?: number;
};

export type RefreshCoordinator = { refresh(request: TokenRequest): Promise<string | null> };

/**
 * Tabs share one refresh cookie, and the API rotates it on every refresh, so two tabs sending
 * the same cookie at once would sign one of them out. Each tab refreshes for itself, one at a
 * time: under a Web Lock when the browser has one, otherwise by waiting for the refreshes
 * other tabs announce on the channel. A refresh that follows another one sends the rotated
 * cookie, so it succeeds too.
 */
export function createRefreshCoordinator({
  locks = null,
  channel = null,
  remoteTimeoutMs = REQUEST_TIMEOUT_MS,
}: RefreshCoordinatorDeps): RefreshCoordinator {
  const remoteDeadlines = new Map<string, number>();
  const listeners = new Set<() => void>();
  let remoteSuccesses = 0;

  channel?.addEventListener("message", (event) => {
    const parsed = messageSchema.safeParse(event.data);
    if (!parsed.success) return;
    if (parsed.data.type === "refresh-started") {
      remoteDeadlines.set(parsed.data.id, Date.now() + remoteTimeoutMs);
    } else {
      remoteDeadlines.delete(parsed.data.id);
      if (parsed.data.ok) remoteSuccesses += 1;
    }
    for (const listener of listeners) listener();
  });

  function hasActiveRemote() {
    const now = Date.now();
    for (const [id, deadline] of remoteDeadlines) {
      if (deadline <= now) remoteDeadlines.delete(id);
    }
    return remoteDeadlines.size > 0;
  }

  /** Resolves once no other tab is refreshing; a tab that vanished mid-refresh stops counting at its deadline. */
  function waitForOtherTabs(): Promise<void> {
    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const check = () => {
        clearTimeout(timer);
        if (!hasActiveRemote()) {
          listeners.delete(check);
          resolve();
          return;
        }
        const nextDeadline = Math.min(...remoteDeadlines.values());
        timer = setTimeout(check, Math.max(nextDeadline - Date.now(), 0));
      };
      listeners.add(check);
      check();
    });
  }

  async function refreshHere(request: TokenRequest) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    channel?.postMessage({ type: "refresh-started", id });
    let token: string | null = null;
    try {
      token = await request();
      return token;
    } finally {
      channel?.postMessage({ type: "refresh-finished", id, ok: token !== null });
    }
  }

  async function withChannelOnly(request: TokenRequest) {
    await waitForOtherTabs();
    const successesBefore = remoteSuccesses;
    const token = await refreshHere(request);
    if (token) return token;
    // Another tab started at the same moment and its request reached the API first.
    await waitForOtherTabs();
    if (remoteSuccesses === successesBefore) return null;
    return refreshHere(request);
  }

  return {
    refresh(request) {
      if (locks) return locks.request(LOCK_NAME, () => refreshHere(request));
      if (channel) return withChannelOnly(request);
      return request();
    },
  };
}

export function browserRefreshCoordinator(): RefreshCoordinator {
  const locks = typeof navigator !== "undefined" && navigator.locks ? navigator.locks : null;
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;
  return createRefreshCoordinator({ locks, channel });
}
