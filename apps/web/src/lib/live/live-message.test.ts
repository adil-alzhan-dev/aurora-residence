import { describe, expect, it } from "vitest";

import { parseLiveMessage } from "./live-message";

const residence = { number: "7.03", floor: 7, status: "RESERVED", priceUsd: 218000, updatedAt: "2026-10-07T09:12:00.000Z" };
const frame = (value: unknown) => JSON.stringify(value);

describe("parseLiveMessage", () => {
  it("reads a residence.updated frame", () => {
    expect(parseLiveMessage(frame({ type: "residence.updated", residence }))).toEqual(residence);
  });

  it.each([
    ["not JSON", "{oops"],
    ["a binary frame", new ArrayBuffer(4)],
    ["another type", frame({ type: "residence.deleted", residence })],
    ["an unknown status", frame({ type: "residence.updated", residence: { ...residence, status: "HELD" } })],
    ["a number outside the house", frame({ type: "residence.updated", residence: { ...residence, number: "12.01" } })],
    ["a price as text", frame({ type: "residence.updated", residence: { ...residence, priceUsd: "218000" } })],
    ["a missing date", frame({ type: "residence.updated", residence: { ...residence, updatedAt: undefined } })],
    ["null", "null"],
  ])("ignores %s", (_case, raw) => {
    expect(parseLiveMessage(raw)).toBeNull();
  });
});
