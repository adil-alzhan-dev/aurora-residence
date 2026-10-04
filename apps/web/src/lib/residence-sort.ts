import type { Residence, ResidenceStatus } from "./api/residences";

export const sortOptions = ["available", "price-asc", "price-desc", "area-desc"] as const;

export type ResidenceSort = (typeof sortOptions)[number];

/** Available first is the default, so it never shows up in the address. */
export const DEFAULT_SORT: ResidenceSort = "available";

const isSort = (value: unknown): value is ResidenceSort => sortOptions.some((option) => option === value);

export function parseResidenceSort(value: string | string[] | undefined): ResidenceSort {
  const first = Array.isArray(value) ? value[0] : value;
  return isSort(first) ? first : DEFAULT_SORT;
}

export const sortParam = (sort: ResidenceSort) => (sort === DEFAULT_SORT ? null : sort);

const statusOrder: Record<ResidenceStatus, number> = { available: 0, reserved: 1, sold: 2 };

const byPlace = (a: Residence, b: Residence) => a.floor - b.floor || a.position - b.position;

const comparators: Record<ResidenceSort, (a: Residence, b: Residence) => number> = {
  available: (a, b) => statusOrder[a.status] - statusOrder[b.status] || a.priceUsd - b.priceUsd || byPlace(a, b),
  "price-asc": (a, b) => a.priceUsd - b.priceUsd || byPlace(a, b),
  "price-desc": (a, b) => b.priceUsd - a.priceUsd || byPlace(a, b),
  "area-desc": (a, b) => b.areaM2 - a.areaM2 || a.priceUsd - b.priceUsd || byPlace(a, b),
};

export const sortResidences = (residences: Residence[], sort: ResidenceSort) =>
  [...residences].sort(comparators[sort]);
