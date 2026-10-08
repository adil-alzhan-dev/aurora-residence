// Checked by hand rather than with zod: this module is on every page of the site, and zod would
// add about 30 KB to the script the first screen waits for. The checks match the event in apps/api.
const RESIDENCE_NUMBER = /^(?:[1-9]|1[01])\.0[1-6]$/;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z$/;
const STATUSES = ["AVAILABLE", "RESERVED", "SOLD"] as const;

export type LiveResidence = {
  number: string;
  floor: number;
  status: (typeof STATUSES)[number];
  priceUsd: number;
  updatedAt: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStatus = (value: unknown): value is LiveResidence["status"] =>
  STATUSES.some((status) => status === value);

function readResidence(value: unknown): LiveResidence | null {
  if (!isRecord(value)) return null;
  const { number, floor, status, priceUsd, updatedAt } = value;
  if (typeof number !== "string" || !RESIDENCE_NUMBER.test(number)) return null;
  if (typeof floor !== "number" || !Number.isSafeInteger(floor) || floor < 1) return null;
  if (!isStatus(status)) return null;
  if (typeof priceUsd !== "number" || !Number.isFinite(priceUsd) || priceUsd < 0) return null;
  if (typeof updatedAt !== "string" || !ISO_DATE_TIME.test(updatedAt) || Number.isNaN(Date.parse(updatedAt))) return null;
  return { number, floor, status, priceUsd, updatedAt };
}

/** A frame from /socket as the residence it describes; anything else is ignored. */
export function parseLiveMessage(raw: unknown): LiveResidence | null {
  if (typeof raw !== "string") return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.type !== "residence.updated") return null;
  return readResidence(data.residence);
}
