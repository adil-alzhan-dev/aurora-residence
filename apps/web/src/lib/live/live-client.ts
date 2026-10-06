import { parseLiveMessage, type LiveResidence } from "./live-message";

export type LiveStatus = "connecting" | "open" | "closed";

export type LiveListener = {
  onResidence?: (residence: LiveResidence) => void;
  /** After a reconnect: events sent while offline are lost, so data must be read again. */
  onResync?: () => void;
};

type SocketLike = Pick<WebSocket, "close"> & {
  onopen: ((event: Event) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
};

type LiveClientOptions = {
  url: string;
  createSocket?: (url: string) => SocketLike;
  random?: () => number;
};

const FIRST_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;
const JITTER = 0.2;
const IDLE_CLOSE_MS = 1000;

/** 1, 2, 4 ... 30 s, each spread by up to 20% so that tabs do not knock all at once. */
export function reconnectDelay(attempt: number, random: () => number = Math.random) {
  const base = Math.min(FIRST_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
  const spread = 1 - JITTER + random() * JITTER * 2;
  return Math.round(Math.min(base * spread, MAX_DELAY_MS));
}

export function liveSocketUrl(location: Pick<Location, "protocol" | "host">) {
  return `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/socket`;
}

/**
 * One server-to-client connection shared by every subscriber of the tab. It opens with the
 * first subscriber, closes with the last one and keeps reconnecting while anyone listens.
 */
export function createLiveClient({ url, createSocket = (target) => new WebSocket(target), random }: LiveClientOptions) {
  const listeners = new Set<LiveListener>();
  const statusListeners = new Set<() => void>();
  let status: LiveStatus = "connecting";
  let socket: SocketLike | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let attempt = 0;
  let missedEvents = false;

  function setStatus(next: LiveStatus) {
    if (next === status) return;
    status = next;
    for (const notify of statusListeners) notify();
  }

  function connect() {
    timer = undefined;
    let current: SocketLike;
    try {
      current = createSocket(url);
    } catch {
      scheduleReconnect();
      return;
    }
    socket = current;
    current.onopen = () => {
      attempt = 0;
      setStatus("open");
      if (!missedEvents) return;
      missedEvents = false;
      for (const listener of [...listeners]) listener.onResync?.();
    };
    current.onmessage = (event) => {
      const residence = parseLiveMessage(event.data);
      if (residence) for (const listener of [...listeners]) listener.onResidence?.(residence);
    };
    current.onerror = () => undefined;
    current.onclose = () => {
      if (socket !== current) return;
      socket = null;
      scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    missedEvents = true;
    if (listeners.size === 0) return;
    setStatus("closed");
    timer = setTimeout(connect, reconnectDelay(attempt, random));
    attempt += 1;
  }

  function stop() {
    idleTimer = undefined;
    clearTimeout(timer);
    timer = undefined;
    const current = socket;
    socket = null;
    current?.close();
    missedEvents = true;
    setStatus("closed");
  }

  return {
    subscribe(listener: LiveListener) {
      listeners.add(listener);
      clearTimeout(idleTimer);
      idleTimer = undefined;
      if (!socket && timer === undefined) connect();
      return () => {
        listeners.delete(listener);
        // A short grace keeps the socket when a page swaps one subscriber for another.
        if (listeners.size === 0 && idleTimer === undefined) idleTimer = setTimeout(stop, IDLE_CLOSE_MS);
      };
    },
    getStatus: () => status,
    subscribeStatus(notify: () => void) {
      statusListeners.add(notify);
      return () => {
        statusListeners.delete(notify);
      };
    },
  };
}

export type LiveClient = ReturnType<typeof createLiveClient>;
