import { describe, expect, it } from "vitest";

import { createEnquirySchema, type EnquiryValues } from "./enquiry-schema";
import { toEnquiryPayload } from "./use-enquiry-submit";

const errors = { name: "name", code: "code", phone: "phone", email: "email", comment: "comment", consent: "consent" };
const schema = createEnquirySchema(errors);

// Copy of the phone rules in apps/api/src/enquiries/dto/create-enquiry.dto.ts.
const API_PHONE_PATTERN = /^\+(?=(?:[\s()-]*\d){7,15}[\s()-]*$)[\d\s()-]+$/;
const API_PHONE_MAX_LENGTH = 25;
const passesApi = (phone: string) => phone.length <= API_PHONE_MAX_LENGTH && API_PHONE_PATTERN.test(phone);

const valid: EnquiryValues = {
  name: "Elena Marsh",
  code: "+1",
  phone: "555 014 2271",
  email: "elena.marsh@example.com",
  consent: true,
  website: "",
};

function check(code: string, phone: string) {
  const values = { ...valid, code, phone };
  const result = schema.safeParse(values);
  const phoneErrors = result.success ? [] : result.error.issues.filter((issue) => issue.path[0] === "phone");
  return { ok: result.success, phoneErrors, payloadPhone: toEnquiryPayload(values, { source: "Contacts form", locale: "en" }).phone };
}

describe("enquiry phone", () => {
  it("accepts a full phone of exactly 25 characters", () => {
    const { ok, payloadPhone } = check("+1", "(555) 010-2040 (12) 34");
    expect(payloadPhone).toHaveLength(25);
    expect(ok).toBe(true);
    expect(passesApi(payloadPhone)).toBe(true);
  });

  it("rejects a full phone of 26 characters on the phone field", () => {
    const { ok, phoneErrors, payloadPhone } = check("+1", "(555) 010-2040 (12) -34");
    expect(payloadPhone).toHaveLength(26);
    expect(ok).toBe(false);
    expect(phoneErrors.map((issue) => issue.message)).toEqual(["phone"]);
  });

  it("accepts 7 and 15 digits including the code", () => {
    expect(check("+1", "555010").ok).toBe(true);
    expect(check("+1", "55501020401234").ok).toBe(true);
  });

  it("rejects 6 and 16 digits including the code", () => {
    expect(check("+1", "55501").phoneErrors).toHaveLength(1);
    expect(check("+1", "555010204012345").phoneErrors).toHaveLength(1);
  });

  it("collapses runs of spaces so the checked phone is the one the API receives", () => {
    const { ok, payloadPhone } = check("+1", "(555)          010          2040");
    expect(ok).toBe(true);
    expect(payloadPhone).toBe("+1 (555) 010 2040");
    expect(passesApi(payloadPhone)).toBe(true);
  });
});
