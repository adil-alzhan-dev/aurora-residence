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

  it("returns field errors from a validation failure", async () => {
    answerWith(
      json(400, {
        statusCode: 400,
        error: "Bad Request",
        message: ["Enter a valid email address"],
        errors: { email: "Enter a valid email address", phone: "Enter a phone number" },
      }),
    );

    await expect(sendEnquiry(payload)).resolves.toEqual({
      kind: "invalid",
      fields: { email: "Enter a valid email address", phone: "Enter a phone number" },
    });
  });

  it("passes on the reason when a residence cannot be requested", async () => {
    const message = "Residence 7.02 is already sold, please choose another one";
    answerWith(json(400, { statusCode: 400, error: "Bad Request", message }));

    await expect(sendEnquiry(payload)).resolves.toEqual({ kind: "rejected", message });
  });

  it("reports the rate limit", async () => {
    answerWith(json(429, { statusCode: 429, message: "ThrottlerException: Too Many Requests" }));

    await expect(sendEnquiry(payload)).resolves.toEqual({ kind: "rate-limited" });
  });

  it.each([
    ["a server error", json(500, { statusCode: 500, message: "Internal server error" })],
    ["a missing residence", json(404, { statusCode: 404, message: "Residence 12.01 not found" })],
    ["a body that is not JSON", new Response("<html>Bad gateway</html>", { status: 502 })],
    ["a network failure", new TypeError("Failed to fetch")],
  ])("fails as a whole on %s", async (_, response) => {
    answerWith(response);

    await expect(sendEnquiry(payload)).resolves.toEqual({ kind: "failed" });
  });
});
