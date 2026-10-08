import { describe, expect, it } from "vitest";

import { en } from "@/content/en";
import { adminEn } from "@/content/en-admin";
import { ru } from "@/content/ru";
import { adminRu } from "@/content/ru-admin";

import { ALL_ERROR_CODES } from "../../../api/src/common/error-codes";
import { apiErrorKey, apiErrorText } from "./admin/api-texts";
import { ENQUIRY_ERROR_TEXTS, enquiryErrorText, readEnquiryResponse } from "./api/enquiries";

// 418 has no general text of its own, so a code missing from the table would fall back to "internalError".
const UNMAPPED_STATUS = 418;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("admin texts for API error codes", () => {
  it.each(ALL_ERROR_CODES)("%s has its own text in English and Russian", (code) => {
    const key = apiErrorKey({ code, status: UNMAPPED_STATUS });
    if (code !== "INTERNAL_ERROR") expect(key).not.toBe("internalError");
    expect(adminEn.messages.api[key].trim()).not.toBe("");
    expect(adminRu.messages.api[key].trim()).not.toBe("");
    expect(adminRu.messages.api[key]).not.toBe(adminEn.messages.api[key]);
  });

  it("keeps no text for a code the API does not have", () => {
    const used = new Set(ALL_ERROR_CODES.map((code) => apiErrorKey({ code, status: UNMAPPED_STATUS })));
    expect(Object.keys(adminEn.messages.api).filter((key) => !used.has(key as never))).toEqual([]);
  });

  it("gives the general text of the status to an unknown or missing code", () => {
    expect(apiErrorText({ code: "SOMETHING_NEW", status: 409 }, adminRu.messages.api)).toBe(adminRu.messages.api.conflict);
    expect(apiErrorText({ code: null, status: 500 }, adminEn.messages.api)).toBe(adminEn.messages.api.internalError);
  });
});

describe("site enquiry form texts for API error codes", () => {
  const handled = Object.entries(ENQUIRY_ERROR_TEXTS);

  it.each(handled)("%s is a code of the API with a text in English and Russian", (code, key) => {
    expect(ALL_ERROR_CODES).toContain(code);
    expect(en.enquirySend[key].trim()).not.toBe("");
    expect(ru.enquirySend[key].trim()).not.toBe("");
    expect(ru.enquirySend[key]).not.toBe(en.enquirySend[key]);
  });

  it("leaves every other code to the general text", async () => {
    const others = ALL_ERROR_CODES.filter((code) => !Object.hasOwn(ENQUIRY_ERROR_TEXTS, code));
    for (const code of [...others, "SOMETHING_NEW"]) {
      expect(enquiryErrorText(code, 400)).toBeNull();
      await expect(readEnquiryResponse(json(400, { statusCode: 400, code, message: "Residence 7.02 is sold" }))).resolves.toEqual({
        kind: "failed",
      });
    }
  });
});
