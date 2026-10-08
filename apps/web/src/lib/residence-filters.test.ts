import { describe, expect, it } from "vitest";

import { allResidences } from "./__fixtures__/residences";
import { parseResidenceFilters } from "./residence-filter-params";
import { countResult, emptyFilters, matchesFilters, summarizeFloors } from "./residence-filters";

describe("residence filters", () => {
  it("uses the full building from the spec as the fixture", () => {
    const byStatus = (status: string) => allResidences.filter((residence) => residence.status === status).length;
    expect(allResidences).toHaveLength(66);
    expect([byStatus("available"), byStatus("reserved"), byStatus("sold")]).toEqual([41, 8, 17]);
  });

  it("finds 22 two-bedroom residences out of 66, 14 of them available", () => {
    const filters = parseResidenceFilters({ bedrooms: "2" });
    const matching = allResidences.filter((residence) => matchesFilters(residence, filters));
    expect(countResult(allResidences, matching)).toEqual({ total: 66, matching: 22, available: 14 });
  });

  it("shows 4 of 6 available on floor 7 from $95 000", () => {
    const floor7 = summarizeFloors(allResidences).find((summary) => summary.floor === 7);
    expect(floor7).toEqual({ floor: 7, total: 6, available: 4, fromPriceUsd: 95_000 });
  });

  it("ignores broken values from a shared link", () => {
    expect(parseResidenceFilters({ bedrooms: "7", maxPrice: "abc", floor: "12" })).toEqual(emptyFilters);
  });
});
