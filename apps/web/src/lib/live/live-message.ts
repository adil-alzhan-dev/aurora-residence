// Checked by hand rather than with zod: this module is on every page of the site, and zod would
// add about 30 KB to the script the first screen waits for. The checks match the event in apps/api.
const RESIDENCE_NUMBER = /^(?:[1-9]|1[01])\.0[1-6]$/;
const ISO_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?Z$/;
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

/** Date.parse rolls 2026-02-30 over to March 2, so the calendar parts are compared after parsing. */
function isIsoDateTime(value: unknown): value is string {
  const parts = typeof value === "string" ? ISO_DATE_TIME.exec(value) : null;
  if (!parts) return false;
  const [year, month, day, hour, minute, second] = parts.slice(1).map((part) => Number(part ?? 0));
  if (hour > 23 || minute > 59 || second > 59) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Floors 1-11 follow from the number pattern above. */
const floorOf = (number: string) => Number(number.slice(0, number.indexOf(".")));

function readResidence(value: unknown): LiveResidence | null {
  if (!isRecord(value)) return null;
  const { number, floor, status, priceUsd, updatedAt } = value;
  if (typeof number !== "string" || !RESIDENCE_NUMBER.test(number)) return null;
  if (typeof floor !== "number" || floor !== floorOf(number)) return null;
  if (!isStatus(status)) return null;
  if (typeof priceUsd !== "number" || !Number.isFinite(priceUsd) || priceUsd < 0) return null;
  if (!isIsoDateTime(updatedAt)) return null;
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
