import { describe, expect, it } from "vitest";

import { readLoginResponse } from "./login";

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

describe("readLoginResponse", () => {
  it("returns the access token on success", async () => {
    await expect(readLoginResponse(json(200, { accessToken: "abc", expiresIn: 900 }))).resolves.toEqual({
      kind: "signed-in",
      accessToken: "abc",
    });
  });

  it("reads attemptsLeft of INVALID_CREDENTIALS", async () => {
    const response = json(401, { statusCode: 401, code: "INVALID_CREDENTIALS", message: "Too many requests", attemptsLeft: 4 });
    await expect(readLoginResponse(response)).resolves.toEqual({ kind: "wrong-credentials", attemptsLeft: 4 });
  });

  it("reads the pause length of LOGIN_LOCKED", async () => {
    const response = json(429, { statusCode: 429, code: "LOGIN_LOCKED", message: "Wrong email", retryAfterSeconds: 840 });
    await expect(readLoginResponse(response)).resolves.toEqual({ kind: "paused", retryAfterSeconds: 840 });
  });

  it("tells the general rate limit from the sign-in lock and takes its Retry-After", async () => {
    const response = json(429, { statusCode: 429, code: "RATE_LIMITED", message: "Sign-in is paused" }, { "Retry-After": "42" });
    await expect(readLoginResponse(response)).resolves.toEqual({ kind: "rate-limited", retryAfterSeconds: 42 });
    const bare = new Response("Too Many Requests", { status: 429 });
    await expect(readLoginResponse(bare)).resolves.toEqual({ kind: "rate-limited", retryAfterSeconds: 60 });
  });

  it("returns field errors of VALIDATION_FAILED", async () => {
    const response = json(400, {
      statusCode: 400,
      code: "VALIDATION_FAILED",
      message: ["email must be an email"],
      errors: { email: "Enter a valid email address" },
    });
    await expect(readLoginResponse(response)).resolves.toEqual({
      kind: "invalid",
      fields: { email: "Enter a valid email address" },
    });
  });

  it("passes any other code or status on for the general text", async () => {
    const tooLarge = json(413, { statusCode: 413, code: "PAYLOAD_TOO_LARGE", message: "Wrong email or password" });
    await expect(readLoginResponse(tooLarge)).resolves.toEqual({ kind: "refused", status: 413, code: "PAYLOAD_TOO_LARGE" });
    const noAttempts = json(401, { statusCode: 401, code: "INVALID_CREDENTIALS", message: "Wrong email or password" });
    await expect(readLoginResponse(noAttempts)).resolves.toEqual({ kind: "refused", status: 401, code: "INVALID_CREDENTIALS" });
    await expect(readLoginResponse(new Response("oops", { status: 502 }))).resolves.toEqual({
      kind: "refused",
      status: 502,
      code: null,
    });
  });

  it("treats a success without a token as a failure", async () => {
    await expect(readLoginResponse(json(200, { expiresIn: 900 }))).resolves.toEqual({ kind: "failed" });
  });
});
