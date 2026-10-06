import { describe, expect, it } from "vitest";

import {
  cleanSearch,
  filtersToSearch,
  parseResidenceFilters,
  residencesApiPath,
  visibleResidences,
} from "./residence-filters";
import type { AdminResidence } from "./schemas";

const residence = (number: string, status: AdminResidence["status"]): AdminResidence => {
  const [floor, position] = number.split(".").map(Number);
  return {
    number,
    floor,
    position,
    bedrooms: 2,
    areaM2: 84.2,
    isPenthouse: false,
    priceUsd: 218_000,
    status,
    side: "SOUTH",
    view: "Park",
    statusChangedAt: new Date(2026, 8, 1),
    reservedUntil: null,
  };
};

describe("residence filters in the address", () => {
  it("reads search, floor and status, any case", () => {
    const params = new URLSearchParams("q=7.03&floor=7&status=reserved");
    expect(parseResidenceFilters(params)).toEqual({ search: "7.03", floor: 7, status: "RESERVED" });
  });

  it("drops values the API would reject", () => {
    const params = new URLSearchParams("q=<script>7&floor=12&status=gone");
    expect(parseResidenceFilters(params)).toEqual({ search: "7", floor: null, status: null });
    expect(cleanSearch("10.05.10.05.")).toHaveLength(10);
  });

  it("writes only the filters that are set", () => {
    expect(filtersToSearch({ search: "", floor: null, status: null })).toBe("");
    expect(filtersToSearch({ search: "7.0", floor: 7, status: "AVAILABLE" })).toBe("?q=7.0&floor=7&status=available");
  });

  it("asks the API without the status so the counts cover every status", () => {
    expect(residencesApiPath({ search: "7.03", floor: null })).toBe("/api/admin/residences?search=7.03");
    expect(residencesApiPath({ search: "", floor: null })).toBe("/api/admin/residences");
  });
});

describe("visibleResidences", () => {
  it("filters by status and lists floor 1 first, by position", () => {
    const items = [residence("2.01", "SOLD"), residence("1.02", "AVAILABLE"), residence("1.01", "AVAILABLE")];
    expect(visibleResidences(items, "AVAILABLE").map((item) => item.number)).toEqual(["1.01", "1.02"]);
    expect(visibleResidences(items, null).map((item) => item.number)).toEqual(["1.01", "1.02", "2.01"]);
  });
});
