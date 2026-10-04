import { z } from "zod";

import { fetchFromApi } from "./client";
import { residenceSchema } from "./residences";

const floorSummarySchema = z.object({
  floor: z.number().int().min(1),
  total: z.number().int().min(0),
  available: z.number().int().min(0),
  fromPriceUsd: z.number().nullable(),
});

const floorDetailsSchema = floorSummarySchema.extend({
  residences: z.array(residenceSchema),
});

export type FloorSummary = z.infer<typeof floorSummarySchema>;

export type FloorDetails = z.infer<typeof floorDetailsSchema>;

export function getFloorSummaries() {
  return fetchFromApi("/api/floors", z.array(floorSummarySchema));
}

export function getFloorDetails(floor: number) {
  return fetchFromApi(`/api/floors/${floor}`, floorDetailsSchema);
}
