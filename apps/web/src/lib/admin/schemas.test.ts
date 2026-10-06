import { describe, expect, it } from "vitest";

import { dashboardSchema } from "./schemas";

const answer = {
  residences: { AVAILABLE: 41, RESERVED: 8, SOLD: 17, total: 66 },
  enquiries: { total: 16, new: 3, newToday: 3 },
  facade: [{ number: "1.01", status: "SOLD" }],
  reservations: [
    { residence: "11.03", client: "Nora Kim", expiresAt: "2026-10-05T10:40:00.000Z", endingSoon: true },
  ],
  latestEnquiries: [
    {
      id: 16,
      createdAt: "2026-10-04T11:48:00.000Z",
      name: "Jonas Weber",
      email: "jonas.weber@example.com",
      phone: "+1 (555) 017-3390",
      status: "NEW",
      source: "Residence page",
      residence: { number: "9.03", bedrooms: 2, areaM2: 84.2, priceUsd: 230_000 },
    },
  ],
};

describe("dashboardSchema", () => {
  it("reads the one-request dashboard answer with dates", () => {
    const parsed = dashboardSchema.parse(answer);
    expect(parsed.residences.AVAILABLE).toBe(41);
    expect(parsed.reservations[0].expiresAt).toBeInstanceOf(Date);
    expect(parsed.latestEnquiries[0].residence?.number).toBe("9.03");
  });

  it("rejects the old answer shape", () => {
    expect(dashboardSchema.safeParse({ ...answer, facade: undefined }).success).toBe(false);
  });
});
