import { connection } from "next/server";
import { z } from "zod";

const REQUEST_TIMEOUT_MS = 3000;

const floorSummarySchema = z.object({
  floor: z.number().int().min(1),
  total: z.number().int().min(0),
  available: z.number().int().min(0),
  fromPriceUsd: z.number().nullable(),
});

export type FloorSummary = z.infer<typeof floorSummarySchema>;

/**
 * Fresh on every request: the facade must show the current availability.
 * Returns null when the API is unreachable so the section can render without numbers.
 */
export async function getFloorSummaries(): Promise<FloorSummary[] | null> {
  await connection();
  const baseUrl = process.env.API_INTERNAL_URL;
  if (!baseUrl) return null;

  try {
    const response = await fetch(new URL("/api/floors", baseUrl), {
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const parsed = z.array(floorSummarySchema).safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
