import { afterEach, describe, expect, it, vi } from "vitest";

import { ENQUIRIES_PATH, sendEnquiry, type EnquiryPayload } from "./enquiries";

const payload: EnquiryPayload = {
  name: "Elena Marsh",
  phone: "+1 555 014 2271",
  email: "elena.marsh@example.com",
  residence: "7.03",
  source: "Residence page",
  consent: true,
  website: "",
  locale: "EN",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function answerWith(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sendEnquiry", () => {
  it("posts the form as JSON and reads the receipt", async () => {
    const fetchMock = answerWith(json(201, { received: true, residence: "7.03" }));

    await expect(sendEnquiry(payload)).resolves.toEqual({ kind: "sent", residence: "7.03" });
    expect(fetchMock).toHaveBeenCalledWith(
      ENQUIRIES_PATH,
      expect.objectContaining({ method: "POST", body: JSON.stringify(payload) }),
    );
  });

  it("returns field errors of VALIDATION_FAILED", async () => {
    answerWith(
      json(400, {
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: ["Enter a valid email address"],
        errors: { email: "Enter a valid email address", phone: "Enter a phone number" },
      }),
    );

    await expect(sendEnquiry(payload)).resolves.toEqual({
      kind: "invalid",
      fields: { email: "Enter a valid email address", phone: "Enter a phone number" },
    });
  });

  // The English message says something else on purpose: only the code decides.
  it.each([
    ["RESIDENCE_SOLD", 400, "soldRejected"],
    ["RESIDENCE_NOT_FOUND", 404, "residenceMissing"],
    ["RATE_LIMITED", 429, "rateLimited"],
  ] as const)("names the reason of %s", async (code, status, text) => {
    answerWith(json(status, { statusCode: status, code, message: "Residence 7.02 is available" }));

    await expect(sendEnquiry(payload)).resolves.toEqual({ kind: "refused", text });
  });

  it("treats a 429 without a code as the rate limit", async () => {
    answerWith(new Response("Too Many Requests", { status: 429 }));

    await expect(sendEnquiry(payload)).resolves.toEqual({ kind: "refused", text: "rateLimited" });
  });

  it.each([
    ["a server error", json(500, { statusCode: 500, code: "INTERNAL_ERROR", message: "Internal server error" })],
    ["an unknown code", json(400, { statusCode: 400, code: "SOMETHING_NEW", message: "Residence 7.02 is sold" })],
    ["a code the form does not explain", json(409, { statusCode: 409, code: "RESIDENCE_RESERVED" })],
    ["a validation failure without fields", json(400, { statusCode: 400, code: "VALIDATION_FAILED", message: "Bad JSON" })],
    ["a body that is not JSON", new Response("<html>Bad gateway</html>", { status: 502 })],
    ["a network failure", new TypeError("Failed to fetch")],
  ])("fails as a whole on %s", async (_, response) => {
    answerWith(response);

    await expect(sendEnquiry(payload)).resolves.toEqual({ kind: "failed" });
  });
});
