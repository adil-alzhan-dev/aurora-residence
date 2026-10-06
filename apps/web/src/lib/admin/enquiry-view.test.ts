import { describe, expect, it } from "vitest";

import { adminEn } from "@/content/en-admin";

import { activityLine, lastNoteSave, receivedLine } from "./enquiry-view";
import type { EnquiryActivity } from "./schemas";

const now = new Date(2026, 9, 4, 12, 13);
const texts = {
  activity: adminEn.enquiry.activity,
  enquiryStatuses: adminEn.enquiries.statuses,
  residenceStatuses: adminEn.facade.statuses,
};
const residence = { number: "7.03", status: "AVAILABLE" as const, priceUsd: 218_000, bedrooms: 2, areaM2: 84.2, isPenthouse: false };

const entry = (patch: Partial<EnquiryActivity>): EnquiryActivity => ({
  at: now,
  type: "NOTE_ADDED",
  from: null,
  to: null,
  note: null,
  author: "Maya Collins",
  residence: null,
  ...patch,
});

describe("enquiry heading line", () => {
  it("names the residence page the enquiry came from", () => {
    const card = { createdAt: new Date(2026, 9, 4, 9, 2), source: "Residence page, Send request", residence };
    expect(receivedLine(card, now, adminEn.enquiry)).toBe("Received today at 09:02 from the page of residence 7.03");
  });

  it("marks an enquiry without a residence as general", () => {
    const card = { createdAt: new Date(2026, 9, 2, 16, 22), source: "Contacts form", residence: null };
    expect(receivedLine(card, now, adminEn.enquiry)).toBe(
      `Received on Oct 2 at 16:22 ${adminEn.enquiry.general}`,
    );
  });
});

describe("enquiry activity", () => {
  it("writes status changes with the manager's words", () => {
    const line = activityLine(entry({ type: "ENQUIRY_STATUS_CHANGED", from: "NEW", to: "IN_PROGRESS" }), texts);
    expect(line).toEqual({ text: "Status changed: New  →  In progress", note: null });
  });

  it("names the residence of a reservation", () => {
    const line = activityLine(
      entry({ type: "STATUS_CHANGED", residence: "7.03", from: "AVAILABLE", to: "RESERVED", note: "Reserved for 7 days" }),
      texts,
    );
    expect(line).toEqual({ text: "Residence 7.03: Available  →  Reserved", note: "Reserved for 7 days" });
  });

  it("keeps the note text out of a note entry and shows the received text", () => {
    expect(activityLine(entry({ note: "Called at 09:30" }), texts)).toEqual({ text: "Note added", note: null });
    expect(activityLine(entry({ type: "ENQUIRY_RECEIVED", note: "Enquiry received" }), texts).text).toBe(
      "Enquiry received",
    );
    expect(activityLine(entry({ type: "ENQUIRY_RESIDENCE_LINKED", to: "4.06" }), texts).text).toBe(
      "Residence 4.06 linked to the enquiry",
    );
  });

  it("finds the newest saved note", () => {
    const newest = entry({ at: new Date(2026, 9, 4, 9, 35) });
    const activity = [entry({ type: "ENQUIRY_STATUS_CHANGED" }), newest, entry({ at: new Date(2026, 9, 3) })];
    expect(lastNoteSave(activity)).toEqual({ at: newest.at, author: "Maya Collins" });
    expect(lastNoteSave([])).toBeNull();
  });
});
