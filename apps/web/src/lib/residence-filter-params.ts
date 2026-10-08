// Kept apart from residence-filters.ts, which runs in the browser: zod stays on the server.
import * as z from "zod/mini";

import { FLOOR_COUNT } from "./building";
import type { ResidenceFilters } from "./residence-filters";

const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const filterParam = (schema: z.ZodMiniNumber<number>) =>
  z.catch(z.nullable(z.pipe(z.transform(firstValue), z.pipe(z.coerce.number(), schema))), null);

const filtersSchema = z.object({
  bedrooms: filterParam(z.int().check(z.minimum(0), z.maximum(3))),
  maxPrice: filterParam(z.int().check(z.positive())),
  floor: filterParam(z.int().check(z.minimum(1), z.maximum(FLOOR_COUNT))),
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
