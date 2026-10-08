import { describe, expect, it } from "vitest";

import { parseLiveMessage } from "./live-message";

const residence = { number: "7.03", floor: 7, status: "RESERVED", priceUsd: 218000, updatedAt: "2026-10-07T09:12:00.000Z" };
const frame = (value: unknown) => JSON.stringify(value);

describe("parseLiveMessage", () => {
  it("reads a residence.updated frame", () => {
    expect(parseLiveMessage(frame({ type: "residence.updated", residence }))).toEqual(residence);
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
    ["a floor below the house", frame({ type: "residence.updated", residence: { ...residence, floor: 0 } })],
    ["a fractional floor", frame({ type: "residence.updated", residence: { ...residence, floor: 7.5 } })],
    ["a negative price", frame({ type: "residence.updated", residence: { ...residence, priceUsd: -1 } })],
    ["a frame without a residence", frame({ type: "residence.updated" })],
    ["null", "null"],
  ])("ignores %s", (_case, raw) => {
    expect(parseLiveMessage(raw)).toBeNull();
  });
});
