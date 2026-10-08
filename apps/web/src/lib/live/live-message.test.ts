import { describe, expect, it } from "vitest";

import { parseLiveMessage } from "./live-message";

const residence = { number: "7.03", floor: 7, status: "RESERVED", priceUsd: 218000, updatedAt: "2026-10-07T09:12:00.000Z" };
const frame = (value: unknown) => JSON.stringify(value);

describe("parseLiveMessage", () => {
  it("reads a residence.updated frame", () => {
    expect(parseLiveMessage(frame({ type: "residence.updated", residence }))).toEqual(residence);
  });

  it.each([
    ["the format the API sends", new Date(Date.UTC(2026, 9, 7, 9, 12)).toISOString()],
    ["an actual leap day", "2028-02-29T09:12:00.000Z"],
    ["the last minute of a day", "2026-12-31T23:59:59.999Z"],
    ["a time without seconds", "2026-10-07T09:12Z"],
  ])("accepts %s", (_case, updatedAt) => {
    expect(parseLiveMessage(frame({ type: "residence.updated", residence: { ...residence, updatedAt } }))).toEqual({
      ...residence,
      updatedAt,
    });
  });

  it("keeps only the known fields", () => {
    const extra = { ...residence, bedrooms: 2 };
    expect(parseLiveMessage(frame({ type: "residence.updated", residence: extra }))).toEqual(residence);
  });

  it.each([
    ["not JSON", "{oops"],
    ["a binary frame", new ArrayBuffer(4)],
    ["another type", frame({ type: "residence.deleted", residence })],
    ["an unknown status", frame({ type: "residence.updated", residence: { ...residence, status: "HELD" } })],
    ["a number outside the house", frame({ type: "residence.updated", residence: { ...residence, number: "12.01" } })],
    ["a price as text", frame({ type: "residence.updated", residence: { ...residence, priceUsd: "218000" } })],
    ["a missing date", frame({ type: "residence.updated", residence: { ...residence, updatedAt: undefined } })],
    ["a date that is not ISO", frame({ type: "residence.updated", residence: { ...residence, updatedAt: "Oct 7, 2026" } })],
    ["February 29 of a common year", frame({ type: "residence.updated", residence: { ...residence, updatedAt: "2026-02-29T09:12:00.000Z" } })],
    ["February 30", frame({ type: "residence.updated", residence: { ...residence, updatedAt: "2026-02-30T09:12:00.000Z" } })],
    ["April 31", frame({ type: "residence.updated", residence: { ...residence, updatedAt: "2026-04-31T09:12:00.000Z" } })],
    ["hour 24", frame({ type: "residence.updated", residence: { ...residence, updatedAt: "2026-10-07T24:00:00.000Z" } })],
    ["minute 60", frame({ type: "residence.updated", residence: { ...residence, updatedAt: "2026-10-07T09:60:00.000Z" } })],
    ["month 13", frame({ type: "residence.updated", residence: { ...residence, updatedAt: "2026-13-07T09:12:00.000Z" } })],
    ["a floor above the house", frame({ type: "residence.updated", residence: { ...residence, floor: 12 } })],
    ["a floor that differs from the number", frame({ type: "residence.updated", residence: { ...residence, floor: 8 } })],
    ["a floor below the house", frame({ type: "residence.updated", residence: { ...residence, floor: 0 } })],
    ["a fractional floor", frame({ type: "residence.updated", residence: { ...residence, floor: 7.5 } })],
    ["a negative price", frame({ type: "residence.updated", residence: { ...residence, priceUsd: -1 } })],
    ["a frame without a residence", frame({ type: "residence.updated" })],
    ["null", "null"],
  ])("ignores %s", (_case, raw) => {
    expect(parseLiveMessage(raw)).toBeNull();
  });
});
