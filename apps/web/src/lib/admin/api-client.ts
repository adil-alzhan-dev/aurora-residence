import { z } from "zod";

export const REFRESH_PATH = "/api/auth/refresh";
export const LOGOUT_PATH = "/api/auth/logout";

const REQUEST_TIMEOUT_MS = 15_000;

const sessionSchema = z.object({ accessToken: z.string().min(1) });

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    message = `Admin API answered ${status}`,
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

type AdminApiOptions = {
  fetchImpl?: typeof fetch;
  onSessionExpired: () => void;
};

/**
 * The access token lives only in this closure, never in storage. A 401 triggers one
 * POST /api/auth/refresh (the refresh cookie is httpOnly) and a single retry; requests
 * that fail at the same time share that refresh instead of rotating the cookie twice.
 */
export function createAdminApi({ fetchImpl = (...args) => fetch(...args), onSessionExpired }: AdminApiOptions) {
  let accessToken: string | null = null;
  let refreshing: Promise<string | null> | null = null;
  let expiryReported = false;

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
    refreshing ??= requestNewToken()
      .then((token) => {
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
      signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  }

  async function request(path: string, init: RequestInit = {}): Promise<Response> {
    const tokenUsed = accessToken;
    const first = await send(path, init, tokenUsed);
    if (first.status !== 401) return first;

    // Another request may have refreshed while this one was in flight.
    const token = accessToken && accessToken !== tokenUsed ? accessToken : await refresh();
    if (!token) {
      expire();
      throw new SessionExpiredError();
    }
    const retried = await send(path, init, token);
    if (retried.status === 401) {
      expire();
      throw new SessionExpiredError();
    }
    return retried;
  }

  async function getJson<Schema extends z.ZodType>(path: string, schema: Schema): Promise<z.infer<Schema>> {
    const response = await request(path);
    if (!response.ok) throw new AdminApiError(response.status);
    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) throw new AdminApiError(response.status, `Unexpected answer from ${path}`);
    return parsed.data;
  }

  async function logout() {
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
    refresh,
    logout,
    setAccessToken,
    hasAccessToken: () => accessToken !== null,
  };
}

export type AdminApi = ReturnType<typeof createAdminApi>;
