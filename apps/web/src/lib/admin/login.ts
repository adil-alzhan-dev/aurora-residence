import { z } from "zod";

import type { ErrorCode } from "../../../../api/src/common/error-codes";

import { hasCode } from "./api-texts";

export const LOGIN_PATH = "/api/auth/login";

const REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_PAUSE_SECONDS = 60;

export type LoginResult =
  | { kind: "signed-in"; accessToken: string }
  | { kind: "wrong-credentials"; attemptsLeft: number }
  | { kind: "paused"; retryAfterSeconds: number }
  | { kind: "rate-limited"; retryAfterSeconds: number }
  | { kind: "invalid"; fields: Partial<Record<"email" | "password", string>> }
  | { kind: "refused"; status: number; code: string | null }
  | { kind: "failed" };

const sessionSchema = z.object({ accessToken: z.string().min(1) });
const errorSchema = z.object({
  code: z.string().optional(),
  attemptsLeft: z.number().int().min(0).optional(),
  retryAfterSeconds: z.number().positive().optional(),
  errors: z.object({ email: z.string().optional(), password: z.string().optional() }).optional(),
});

function retryAfterHeader(response: Response) {
  const seconds = Number(response.headers.get("Retry-After"));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_PAUSE_SECONDS;
}

/** Decided by the error code only; the English message of the API is never read. */
export async function readLoginResponse(response: Response): Promise<LoginResult> {
  const body: unknown = await response.json().catch(() => null);

  if (response.ok) {
    const session = sessionSchema.safeParse(body);
    return session.success ? { kind: "signed-in", accessToken: session.data.accessToken } : { kind: "failed" };
  }
  const parsed = errorSchema.safeParse(body);
  const error = parsed.success ? parsed.data : {};
  const code = error.code ?? null;
  const is = (expected: ErrorCode) => hasCode({ code }, expected);

  if (is("INVALID_CREDENTIALS") && error.attemptsLeft !== undefined) {
    return { kind: "wrong-credentials", attemptsLeft: error.attemptsLeft };
  }
  if (is("LOGIN_LOCKED")) {
    return { kind: "paused", retryAfterSeconds: error.retryAfterSeconds ?? retryAfterHeader(response) };
  }
  // The general limit sends only a Retry-After header; a 429 without a code is treated the same way.
  if (is("RATE_LIMITED") || (code === null && response.status === 429)) {
    return { kind: "rate-limited", retryAfterSeconds: retryAfterHeader(response) };
  }
  if (is("VALIDATION_FAILED") && error.errors) return { kind: "invalid", fields: error.errors };
  return { kind: "refused", status: response.status, code };
}

export async function signIn(email: string, password: string): Promise<LoginResult> {
  try {
    const response = await fetch(LOGIN_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return await readLoginResponse(response);
  } catch {
    return { kind: "failed" };
  }
}
