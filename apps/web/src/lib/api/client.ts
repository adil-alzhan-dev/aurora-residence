import { connection } from "next/server";
import type { z } from "zod";

const REQUEST_TIMEOUT_MS = 3000;

/**
 * Fresh on every request: pages must show the current availability.
 * Returns null when the API is unreachable or answers with something unexpected,
 * so a page can explain the problem instead of failing.
 */
export async function fetchFromApi<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
): Promise<z.infer<Schema> | null> {
  await connection();
  const baseUrl = process.env.API_INTERNAL_URL;
  if (!baseUrl) return null;

  try {
    const response = await fetch(new URL(path, baseUrl), {
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const parsed = schema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
