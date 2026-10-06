import type { AdminEnquiryStatus } from "./schemas";

export type EnquiryFilters = {
  search: string;
  status: AdminEnquiryStatus | null;
  residence: string | null;
  page: number;
};

type ParamsLike = { get(name: string): string | null };

export const ENQUIRY_STATUSES: AdminEnquiryStatus[] = ["NEW", "IN_PROGRESS", "CLOSED"];
export const ENQUIRIES_PAGE_SIZE = 20;

const SEARCH_MAX = 100;
const RESIDENCE_NUMBER = /^(1[01]|[1-9])\.0[1-6]$/;

export const isResidenceNumber = (value: string) => RESIDENCE_NUMBER.test(value);

/** Name, email or phone as the API matches them: one line, no outer spaces, at most 100 characters. */
export const cleanEnquirySearch = (raw: string) => raw.replace(/\s+/g, " ").trim().slice(0, SEARCH_MAX);

function parsePage(raw: string | null) {
  if (!raw || !/^\d{1,4}$/.test(raw)) return 1;
  return Math.max(1, Number(raw));
}

export function parseEnquiryFilters(params: ParamsLike): EnquiryFilters {
  const status = params.get("status")?.toUpperCase().replace("-", "_");
  const residence = params.get("residence") ?? "";
  return {
    search: cleanEnquirySearch(params.get("q") ?? ""),
    status: ENQUIRY_STATUSES.find((item) => item === status) ?? null,
    residence: isResidenceNumber(residence) ? residence : null,
    page: parsePage(params.get("page")),
  };
}

/** Query string for the page address; empty filters and the first page stay out of it. */
export function enquiryFiltersToSearch(filters: EnquiryFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.status) params.set("status", filters.status.toLowerCase().replace("_", "-"));
  if (filters.residence) params.set("residence", filters.residence);
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Any filter change starts again from the first page, otherwise the page could be empty. */
export function nextEnquiryFilters(current: EnquiryFilters, change: Partial<EnquiryFilters>): EnquiryFilters {
  const page = change.page ?? (Object.keys(change).length > 0 ? 1 : current.page);
  return { ...current, ...change, page };
}

type ApiFilters = Pick<EnquiryFilters, "search" | "residence"> & { status: AdminEnquiryStatus | null };

function apiParams({ search, status, residence }: ApiFilters) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (residence) params.set("residence", residence);
  return params;
}

export function enquiriesApiPath(filters: EnquiryFilters) {
  const params = apiParams(filters);
  params.set("limit", String(ENQUIRIES_PAGE_SIZE));
  params.set("offset", String((filters.page - 1) * ENQUIRIES_PAGE_SIZE));
  return `/api/admin/enquiries?${params.toString()}`;
}

/** One row is enough: the tabs only need the total of each status. */
export function enquiryCountPath(filters: ApiFilters) {
  const params = apiParams(filters);
  params.set("limit", "1");
  return `/api/admin/enquiries?${params.toString()}`;
}

export const pageCount = (total: number) => Math.max(1, Math.ceil(total / ENQUIRIES_PAGE_SIZE));

/** "1-20" for the first page of 34, "21-34" for the second. */
export function pageRange(page: number, total: number) {
  if (total === 0) return { from: 0, to: 0 };
  const from = (page - 1) * ENQUIRIES_PAGE_SIZE + 1;
  return { from, to: Math.min(total, page * ENQUIRIES_PAGE_SIZE) };
}
