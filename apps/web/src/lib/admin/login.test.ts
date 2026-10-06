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

  it("reads attemptsLeft from a 401", async () => {
    const response = json(401, { message: "Wrong email or password.", attemptsLeft: 4 });
    await expect(readLoginResponse(response)).resolves.toEqual({ kind: "wrong-credentials", attemptsLeft: 4 });
  });

  it("reads the pause length of the sign-in lock", async () => {
    const response = json(429, { message: "Sign-in is paused", retryAfterSeconds: 840 });
    await expect(readLoginResponse(response)).resolves.toEqual({ kind: "paused", retryAfterSeconds: 840 });
  });

  it("falls back to Retry-After for the general rate limit", async () => {
    const response = json(429, { message: "Too many requests." }, { "Retry-After": "42" });
    await expect(readLoginResponse(response)).resolves.toEqual({ kind: "paused", retryAfterSeconds: 42 });
  });

  it("returns field errors from a 400", async () => {
    const response = json(400, { message: "Bad Request", errors: { email: "Enter a valid email address" } });
    await expect(readLoginResponse(response)).resolves.toEqual({
      kind: "invalid",
      fields: { email: "Enter a valid email address" },
    });
  });

  it("treats anything else as a failure", async () => {
    await expect(readLoginResponse(new Response("oops", { status: 502 }))).resolves.toEqual({ kind: "failed" });
  });
});
