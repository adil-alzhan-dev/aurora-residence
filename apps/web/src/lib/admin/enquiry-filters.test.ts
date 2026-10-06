import { describe, expect, it } from "vitest";

import {
  cleanEnquirySearch,
  enquiriesApiPath,
  enquiryCountPath,
  enquiryFiltersToSearch,
  nextEnquiryFilters,
  pageCount,
  pageRange,
  parseEnquiryFilters,
} from "./enquiry-filters";

const parse = (query: string) => parseEnquiryFilters(new URLSearchParams(query));

describe("enquiry filters in the address", () => {
  it("reads search, status, residence and page", () => {
    expect(parse("q=elena&status=in-progress&residence=7.03&page=2")).toEqual({
      search: "elena",
      status: "IN_PROGRESS",
      residence: "7.03",
      page: 2,
    });
  });

  it("falls back to no filter for anything unknown", () => {
    expect(parse("status=open&residence=12.01&page=-3")).toEqual({
      search: "",
      status: null,
      residence: null,
      page: 1,
    });
    expect(parse("residence=7.3").residence).toBeNull();
    expect(parse("page=abc").page).toBe(1);
    expect(parse("page=0").page).toBe(1);
  });

  it("accepts the API spelling of a status", () => {
    expect(parse("status=NEW").status).toBe("NEW");
    expect(parse("status=IN_PROGRESS").status).toBe("IN_PROGRESS");
    expect(parse("status=closed").status).toBe("CLOSED");
  });

  it("cleans the search like the API reads it", () => {
    expect(cleanEnquirySearch("  Elena   Marsh ")).toBe("Elena Marsh");
    expect(cleanEnquirySearch("a".repeat(150))).toHaveLength(100);
    expect(parse(`q=${encodeURIComponent("  +1 (555) 014 ")}`).search).toBe("+1 (555) 014");
  });

  it("writes back only the filters that are set", () => {
    expect(enquiryFiltersToSearch({ search: "", status: null, residence: null, page: 1 })).toBe("");
    expect(enquiryFiltersToSearch({ search: "elena marsh", status: "IN_PROGRESS", residence: "7.03", page: 3 })).toBe(
      "?q=elena+marsh&status=in-progress&residence=7.03&page=3",
    );
  });

  it("round-trips through the address", () => {
    const filters = { search: "weber", status: "NEW" as const, residence: "9.03", page: 2 };
    expect(parse(enquiryFiltersToSearch(filters).slice(1))).toEqual(filters);
  });

  it("goes back to the first page when a filter changes", () => {
    const current = { search: "", status: null, residence: null, page: 3 };
    expect(nextEnquiryFilters(current, { status: "NEW" }).page).toBe(1);
    expect(nextEnquiryFilters(current, { page: 2 }).page).toBe(2);
    expect(nextEnquiryFilters(current, {}).page).toBe(3);
  });
});

describe("enquiry API paths", () => {
  it("pages with limit and offset", () => {
    expect(enquiriesApiPath({ search: "", status: null, residence: null, page: 1 })).toBe(
      "/api/admin/enquiries?limit=20&offset=0",
    );
    expect(enquiriesApiPath({ search: "elena", status: "NEW", residence: "7.03", page: 3 })).toBe(
      "/api/admin/enquiries?search=elena&status=NEW&residence=7.03&limit=20&offset=40",
    );
  });

  it("counts a status with a one-row request", () => {
    expect(enquiryCountPath({ search: "", status: "CLOSED", residence: null })).toBe(
      "/api/admin/enquiries?status=CLOSED&limit=1",
    );
  });

  it("works out pages and the shown range", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(16)).toBe(1);
    expect(pageCount(21)).toBe(2);
    expect(pageRange(1, 16)).toEqual({ from: 1, to: 16 });
    expect(pageRange(2, 34)).toEqual({ from: 21, to: 34 });
    expect(pageRange(1, 0)).toEqual({ from: 0, to: 0 });
  });
});
