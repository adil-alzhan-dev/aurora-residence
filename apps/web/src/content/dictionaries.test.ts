import { describe, expect, it } from "vitest";

import { en } from "./en";
import { ru } from "./ru";

/** Every leaf of a dictionary as "path: value", arrays by index. */
function leaves(value: unknown, path = ""): [string, unknown][] {
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key));
  }
  return [[path, value]];
}

const enLeaves = new Map(leaves(en));
const ruLeaves = new Map(leaves(ru));

describe("site dictionaries", () => {
  it("have the same keys in English and Russian", () => {
    expect([...ruLeaves.keys()].sort()).toEqual([...enLeaves.keys()].sort());
  });

  it("have no empty strings in Russian unless the English one is empty too", () => {
    const isEmpty = (value: unknown) => typeof value === "string" && value.trim() === "";
    const empty = [...ruLeaves].filter(([key, value]) => isEmpty(value) && !isEmpty(enLeaves.get(key)));
    expect(empty).toEqual([]);
  });

  it("use the same placeholders in both languages", () => {
    const placeholders = (value: unknown) => (typeof value === "string" ? (value.match(/\{\w+\}/g) ?? []).sort() : []);
    // Russian may drop a number where it reads better without it ("all residences are sold").
    const allowedToDrop = new Set(["floorPage.summarySoldOut"]);
    const mismatched = [...enLeaves]
      .filter(([key]) => !allowedToDrop.has(key))
      .filter(([key, value]) => placeholders(value).join() !== placeholders(ruLeaves.get(key)).join())
      .map(([key]) => key);
    expect(mismatched).toEqual([]);
  });

  it("have no long dashes", () => {
    const withDash = [...enLeaves, ...ruLeaves].filter(([, value]) => typeof value === "string" && value.includes("—"));
    expect(withDash).toEqual([]);
  });

  it("keep the penthouse caption and statuses agreed for Russian", () => {
    expect(ru.floorPage.penthouse.replace("\u00a0", " ")).toBe("Пентхаус, с террасой");
    expect(ru.status).toEqual({ available: "Свободна", reserved: "Бронь", sold: "Продана" });
  });
});
