import { z } from "zod";

const RESIDENCE_NUMBER = /^(?:[1-9]|1[01])\.0[1-6]$/;

const residenceUpdatedSchema = z.object({
  type: z.literal("residence.updated"),
  residence: z.object({
    number: z.string().regex(RESIDENCE_NUMBER),
    floor: z.number().int().min(1),
    status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]),
    priceUsd: z.number().nonnegative(),
    updatedAt: z.iso.datetime(),
  }),
});

export type LiveResidence = z.infer<typeof residenceUpdatedSchema>["residence"];

/** A frame from /socket as the residence it describes; anything else is ignored. */
export function parseLiveMessage(raw: unknown): LiveResidence | null {
  if (typeof raw !== "string") return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = residenceUpdatedSchema.safeParse(data);
  return parsed.success ? parsed.data.residence : null;
}
