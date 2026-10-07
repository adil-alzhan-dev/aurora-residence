import { z } from "zod";

import type { RefreshCoordinator } from "./refresh-coordinator";

export const REFRESH_PATH = "/api/auth/refresh";
export const LOGOUT_PATH = "/api/auth/logout";

export const REQUEST_TIMEOUT_MS = 15_000;

const sessionSchema = z.object({ accessToken: z.string().min(1) });

const errorBodySchema = z.object({
  message: z.union([z.string(), z.array(z.string())]).optional(),
  errors: z.record(z.string(), z.string()).optional(),
});

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    message = `Admin API answered ${status}`,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

export class SessionExpiredError extends AdminApiError {
  constructor() {
    super(401, "Admin session expired");
    this.name = "SessionExpiredError";
  }
}

function withTimeout(signal: AbortSignal | null | undefined) {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

/**
 * Stops waiting when `signal` aborts, but leaves `promise` itself running: a shared refresh
 * is still needed by the other requests waiting on it.
 */
function untilAborted<T>(promise: Promise<T>, signal: AbortSignal | null | undefined): Promise<T> {
  if (!signal) return promise;
  signal.throwIfAborted();
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

type AdminApiOptions = {
  fetchImpl?: typeof fetch;
  onSessionExpired: () => void;
  /** Keeps refreshes of several tabs from rotating the shared cookie at the same time. */
  coordinator?: RefreshCoordinator | null;
};

/**
 * The access token lives only in this closure, never in storage. A 401 triggers one
 * POST /api/auth/refresh (the refresh cookie is httpOnly) and a single retry; requests
 * that fail at the same time share that refresh instead of rotating the cookie twice.
 */
export function createAdminApi({
  fetchImpl = (...args) => fetch(...args),
  onSessionExpired,
  coordinator = null,
}: AdminApiOptions) {
  let accessToken: string | null = null;
  let refreshing: Promise<string | null> | null = null;
  let expiryReported = false;
  /** Bumped on logout, so a refresh that was already in flight cannot bring the session back. */
  let sessionGeneration = 0;

  function setAccessToken(token: string | null) {
    accessToken = token;
    if (token) expiryReported = false;
  }

  function expire() {
    accessToken = null;
    if (expiryReported) return;
    expiryReported = true;
    onSessionExpired();
  }

  async function requestNewToken(): Promise<string | null> {
    try {
      const response = await fetchImpl(REFRESH_PATH, {
        method: "POST",
        credentials: "same-origin",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) return null;
      const parsed = sessionSchema.safeParse(await response.json());
      return parsed.success ? parsed.data.accessToken : null;
    } catch {
      return null;
    }
  }

  /** Resolves to the new access token, or null when there is no valid session. */
  function refresh(): Promise<string | null> {
    const generation = sessionGeneration;
    refreshing ??= (coordinator ? coordinator.refresh(requestNewToken) : requestNewToken())
      .then((token) => {
        if (generation !== sessionGeneration) return null;
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshing = null;
      });
    return refreshing;
  }

  function send(path: string, init: RequestInit, token: string | null) {
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetchImpl(path, {
      ...init,
      headers,
      credentials: "same-origin",
      signal: withTimeout(init.signal),
    });
  }

  /**
   * A fetch can resolve with 401 just before React Query cancels the query, so the signal is
   * checked after every wait: a cancelled request never refreshes, retries or expires the session.
   */
  async function request(path: string, init: RequestInit = {}): Promise<Response> {
    const { signal } = init;
    const tokenUsed = accessToken;
    const first = await send(path, init, tokenUsed);
    signal?.throwIfAborted();
    if (first.status !== 401) return first;

    // Another request may have refreshed while this one was in flight.
    const token = accessToken && accessToken !== tokenUsed ? accessToken : await untilAborted(refresh(), signal);
    signal?.throwIfAborted();
    if (!token) {
      expire();
      throw new SessionExpiredError();
    }
    const retried = await send(path, init, token);
    signal?.throwIfAborted();
    if (retried.status === 401) {
      expire();
      throw new SessionExpiredError();
    }
    return retried;
  }

  /** `signal` is React Query's: a cancelled query aborts its fetch instead of letting it finish. */
  async function getJson<Schema extends z.ZodType>(
    path: string,
    schema: Schema,
    signal?: AbortSignal,
  ): Promise<z.infer<Schema>> {
    const response = await request(path, { signal });
    if (!response.ok) throw new AdminApiError(response.status);
    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) throw new AdminApiError(response.status, `Unexpected answer from ${path}`);
    return parsed.data;
  }

  async function failure(response: Response): Promise<AdminApiError> {
    const parsed = errorBodySchema.safeParse(await response.json().catch(() => null));
    const message = parsed.success ? parsed.data.message : undefined;
    return new AdminApiError(
      response.status,
      Array.isArray(message) ? message.join(". ") : message,
      parsed.success ? parsed.data.errors : undefined,
    );
  }

  /** A change sent as JSON; a refused one throws AdminApiError with the API's message. */
  async function sendJson<Schema extends z.ZodType>(
    path: string,
    method: "PATCH" | "POST",
    body: unknown,
    schema: Schema,
  ): Promise<z.infer<Schema>> {
    const response = await request(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw await failure(response);
    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) throw new AdminApiError(response.status, `Unexpected answer from ${path}`);
    return parsed.data;
  }

  async function logout() {
    sessionGeneration += 1;
    try {
      await send(LOGOUT_PATH, { method: "POST" }, accessToken);
    } finally {
      accessToken = null;
      expiryReported = true;
    }
  }

  return {
    request,
    getJson,
    sendJson,
    refresh,
    logout,
    setAccessToken,
    hasAccessToken: () => accessToken !== null,
  };
}

export type AdminApi = ReturnType<typeof createAdminApi>;
