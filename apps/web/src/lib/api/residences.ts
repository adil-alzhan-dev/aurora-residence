import { z } from "zod";

import { fetchFromApi } from "./client";

export type ResidenceStatus = "available" | "reserved" | "sold";

export const residenceSchema = z.object({
  number: z.string(),
  floor: z.number().int().min(1),
  position: z.number().int().min(1),
  bedrooms: z.number().int().min(0),
  areaM2: z.number(),
  isPenthouse: z.boolean(),
  priceUsd: z.number(),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]).transform((status) => status.toLowerCase() as ResidenceStatus),
});

export type Residence = z.infer<typeof residenceSchema>;

export type ResidenceQuery = {
  bedrooms?: number | null;
  maxPrice?: number | null;
  floor?: number | null;
};

/** Sorted by the API: available first, then reserved and sold, each by price. */
export function getResidences(query: ResidenceQuery = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) params.set(key, String(value));
  }
  const search = params.size > 0 ? `?${params}` : "";
  return fetchFromApi(`/api/residences${search}`, z.array(residenceSchema));
}
