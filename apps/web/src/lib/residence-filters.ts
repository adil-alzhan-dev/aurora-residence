import { z } from "zod";

import type { FloorSummary } from "./api/floors";
import type { Residence } from "./api/residences";
import { FLOOR_COUNT, floorNumbers } from "./building";

export type ResidenceFilters = {
  bedrooms: number | null;
  maxPrice: number | null;
  floor: number | null;
};

export const emptyFilters: ResidenceFilters = { bedrooms: null, maxPrice: null, floor: null };

export const bedroomOptions = [0, 1, 2, 3] as const;

export const maxPriceOptions = [150_000, 200_000, 250_000, 300_000, 400_000] as const;

const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const filterParam = (schema: z.ZodNumber) =>
  z.preprocess(firstValue, z.coerce.number().pipe(schema)).nullable().catch(null);

const filtersSchema = z.object({
  bedrooms: filterParam(z.number().int().min(0).max(3)),
  maxPrice: filterParam(z.number().int().positive()),
  floor: filterParam(z.number().int().min(1).max(FLOOR_COUNT)),
});

type SearchParams = Record<string, string | string[] | undefined>;

/** Broken or unknown values in a shared link are ignored rather than shown as an error. */
export function parseResidenceFilters(params: SearchParams): ResidenceFilters {
  return filtersSchema.parse({
    bedrooms: params.bedrooms ?? null,
    maxPrice: params.maxPrice ?? null,
    floor: params.floor ?? null,
  });
}

export const activeFilterCount = (filters: ResidenceFilters) =>
  Object.values(filters).filter((value) => value !== null).length;

/** Other address parameters that must survive a filter change, such as the view and the sort order. */
export type KeptParams = Record<string, string | null | undefined>;

export function filtersToSearch(filters: ResidenceFilters, keep: KeptParams = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(keep)) {
    if (value) params.set(key, value);
  }
  for (const [key, value] of Object.entries(filters)) {
    if (value !== null) params.set(key, String(value));
  }
  return params.size > 0 ? `?${params}` : "";
}

export function matchesFilters(residence: Residence, filters: ResidenceFilters) {
  return (
    (filters.bedrooms === null || residence.bedrooms === filters.bedrooms) &&
    (filters.maxPrice === null || residence.priceUsd <= filters.maxPrice) &&
    (filters.floor === null || residence.floor === filters.floor)
  );
}

/** Same shape as GET /api/floors, but counted over the residences that match the filters. */
export function summarizeFloors(residences: Residence[]): FloorSummary[] {
  return floorNumbers.map((floor) => {
    const onFloor = residences.filter((residence) => residence.floor === floor);
    const prices = onFloor
      .filter((residence) => residence.status === "available")
      .map((residence) => residence.priceUsd);
    return {
      floor,
      total: onFloor.length,
      available: prices.length,
      fromPriceUsd: prices.length > 0 ? Math.min(...prices) : null,
    };
  });
}

export type FilterResult = {
  total: number;
  matching: number;
  available: number;
};

export function countResult(all: Residence[], matching: Residence[]): FilterResult {
  return {
    total: all.length,
    matching: matching.length,
    available: matching.filter((residence) => residence.status === "available").length,
  };
}
