import { isFloorNumber } from "@/lib/building";

import type { AdminResidence, AdminResidenceStatus } from "./schemas";

export type ResidenceFilters = {
  search: string;
  floor: number | null;
  status: AdminResidenceStatus | null;
};

type ParamsLike = { get(name: string): string | null };

const STATUSES: AdminResidenceStatus[] = ["AVAILABLE", "RESERVED", "SOLD"];
const SEARCH_MAX = 10;

/** The API matches part of a number such as "7.03", so only digits and dots are kept. */
export const cleanSearch = (raw: string) => raw.replace(/[^\d.]/g, "").slice(0, SEARCH_MAX);

export function parseResidenceFilters(params: ParamsLike): ResidenceFilters {
  const floor = Number(params.get("floor"));
  const status = params.get("status")?.toUpperCase();
  return {
    search: cleanSearch(params.get("q") ?? ""),
    floor: isFloorNumber(floor) ? floor : null,
    status: STATUSES.find((item) => item === status) ?? null,
  };
}

/** Query string for the page address; empty filters stay out of it. */
export function filtersToSearch(filters: ResidenceFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.floor) params.set("floor", String(filters.floor));
  if (filters.status) params.set("status", filters.status.toLowerCase());
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** The status is filtered on the page, so the API counts every status of the search and floor. */
export function residencesApiPath({ search, floor }: Pick<ResidenceFilters, "search" | "floor">) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (floor) params.set("floor", String(floor));
  const query = params.toString();
  return query ? `/api/admin/residences?${query}` : "/api/admin/residences";
}

export function visibleResidences(items: AdminResidence[], status: AdminResidenceStatus | null) {
  return items
    .filter((item) => !status || item.status === status)
    .sort((a, b) => a.floor - b.floor || a.position - b.position);
}
