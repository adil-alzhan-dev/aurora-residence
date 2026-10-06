import { z } from "zod";

export const LOGIN_PATH = "/api/auth/login";

const REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_PAUSE_SECONDS = 60;

export type LoginResult =
  | { kind: "signed-in"; accessToken: string }
  | { kind: "wrong-credentials"; attemptsLeft: number }
  | { kind: "paused"; retryAfterSeconds: number }
  | { kind: "invalid"; fields: Partial<Record<"email" | "password", string>> }
  | { kind: "failed" };

const sessionSchema = z.object({ accessToken: z.string().min(1) });
const wrongSchema = z.object({ attemptsLeft: z.number().int().min(0) });
const pausedSchema = z.object({ retryAfterSeconds: z.number().positive() });
const fieldsSchema = z.object({
  errors: z.object({ email: z.string().optional(), password: z.string().optional() }),
});

function retryAfterHeader(response: Response) {
  const seconds = Number(response.headers.get("Retry-After"));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_PAUSE_SECONDS;
}

export async function readLoginResponse(response: Response): Promise<LoginResult> {
  const body: unknown = await response.json().catch(() => null);

  if (response.ok) {
    const session = sessionSchema.safeParse(body);
    return session.success ? { kind: "signed-in", accessToken: session.data.accessToken } : { kind: "failed" };
  }
  if (response.status === 401) {
    const wrong = wrongSchema.safeParse(body);
    if (wrong.success) return { kind: "wrong-credentials", attemptsLeft: wrong.data.attemptsLeft };
  }
  // The sign-in lock sends retryAfterSeconds; the general rate limit only a Retry-After header.
  if (response.status === 429) {
    const paused = pausedSchema.safeParse(body);
    return { kind: "paused", retryAfterSeconds: paused.success ? paused.data.retryAfterSeconds : retryAfterHeader(response) };
  }
  if (response.status === 400) {
    const fields = fieldsSchema.safeParse(body);
    if (fields.success) return { kind: "invalid", fields: fields.data.errors };
  }
  return { kind: "failed" };
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
