import { describe, expect, it } from "vitest";

import { calculateInstalments } from "./instalment";

const PRICE_7_03 = 218_000;

describe("calculateInstalments", () => {
  it("matches the residence 7.03 example: 30% down over 24 months", () => {
    expect(calculateInstalments(PRICE_7_03, 30, 24)).toEqual({
      percent: 30,
      term: 24,
      downPayment: 65_400,
      financed: 152_600,
      monthly: 6_358,
    });
  });

  it("pays 70% down over 6 months", () => {
    expect(calculateInstalments(PRICE_7_03, 70, 6).monthly).toBe(10_900);
  });

  it("pays 10% down over 60 months", () => {
    expect(calculateInstalments(PRICE_7_03, 10, 60).monthly).toBe(3_270);
  });

  it("keeps the down payment and the term inside the plan limits", () => {
    const result = calculateInstalments(PRICE_7_03, 90, 120);
    expect(result.percent).toBe(70);
    expect(result.term).toBe(60);
  });
});
