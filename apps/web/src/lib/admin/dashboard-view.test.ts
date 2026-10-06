import { describe, expect, it } from "vitest";

import { adminEn } from "@/content/en-admin";

import { calendarDaysLeft, formatReceived, percentOf, reservationRows, residenceDetails } from "./dashboard-view";
import type { AdminResidence } from "./schemas";

const now = new Date(2026, 9, 4, 12, 0);

const residence = (overrides: Partial<AdminResidence>): AdminResidence => ({
  number: "7.03",
  floor: 7,
  position: 3,
  bedrooms: 2,
  areaM2: 84.2,
  isPenthouse: false,
  priceUsd: 218_000,
  status: "AVAILABLE",
  reservedUntil: null,
  ...overrides,
});

describe("calendarDaysLeft", () => {
  it("counts calendar days, not 24-hour periods", () => {
    expect(calendarDaysLeft(new Date(2026, 9, 5, 9, 0), now)).toBe(1);
    expect(calendarDaysLeft(new Date(2026, 9, 6, 23, 0), now)).toBe(2);
    expect(calendarDaysLeft(new Date(2026, 9, 4, 18, 0), now)).toBe(0);
  });
});

describe("formatReceived", () => {
  const t = adminEn.enquiries;

  it("says today and yesterday, then the date", () => {
    expect(formatReceived(new Date(2026, 9, 4, 11, 48), now, t)).toBe("Today, 11:48");
    expect(formatReceived(new Date(2026, 9, 3, 18, 40), now, t)).toBe("Yesterday, 18:40");
    expect(formatReceived(new Date(2026, 9, 2, 9, 5), now, t)).toBe("Oct 2, 09:05");
  });
});

describe("residenceDetails", () => {
  it("shows bedrooms, area and price, a studio by name", () => {
    expect(residenceDetails(residence({}), adminEn.enquiries)).toBe("2 bd, 84.2 m², $218\u00a0000");
    expect(residenceDetails(residence({ bedrooms: 0, areaM2: 38.2, priceUsd: 95_000 }), adminEn.enquiries)).toBe(
      "Studio, 38.2 m², $95\u00a0000",
    );
  });
});

describe("reservationRows", () => {
  it("lists active reservations soonest first and marks the ones the API counts as ending", () => {
    const rows = reservationRows(
      [
        residence({ number: "3.03", status: "RESERVED", reservedUntil: new Date(2026, 9, 10, 14, 5) }),
        residence({ number: "11.03", status: "RESERVED", reservedUntil: new Date(2026, 9, 5, 10, 40) }),
        residence({ number: "7.03" }),
        residence({ number: "6.04", status: "SOLD" }),
      ],
      new Map([["11.03", "Nora Kim"]]),
      new Set(["11.03"]),
      now,
    );

    expect(rows).toEqual([
      { number: "11.03", client: "Nora Kim", endsAt: new Date(2026, 9, 5, 10, 40), daysLeft: 1, endingSoon: true },
      { number: "3.03", client: null, endsAt: new Date(2026, 9, 10, 14, 5), daysLeft: 6, endingSoon: false },
    ]);
  });
});

describe("percentOf", () => {
  it("rounds to a whole percent and survives an empty house", () => {
    expect(percentOf(17, 66)).toBe(26);
    expect(percentOf(1, 0)).toBe(0);
  });
});
