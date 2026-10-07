import { describe, expect, it } from "vitest";

import { en } from "./en";
import { adminEn } from "./en-admin";
import { ru } from "./ru";
import { adminRu } from "./ru-admin";

/** Every leaf of a dictionary as "path: value", arrays by index. */
function leaves(value: unknown, path = ""): [string, unknown][] {
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key));
  }
  return [[path, value]];
}

const placeholders = (value: unknown) => (typeof value === "string" ? (value.match(/\{\w+\}/g) ?? []).sort() : []);
const isEmpty = (value: unknown) => typeof value === "string" && value.trim() === "";

const pairs = [
  // Russian may drop a number where it reads better without it ("all residences are sold").
  { name: "site", en, ru, allowedToDrop: new Set(["floorPage.summarySoldOut"]) },
  { name: "admin", en: adminEn, ru: adminRu, allowedToDrop: new Set<string>() },
];

describe.each(pairs)("$name dictionaries", ({ en: english, ru: russian, allowedToDrop }) => {
  const enLeaves = new Map(leaves(english));
  const ruLeaves = new Map(leaves(russian));

  it("have the same keys in English and Russian", () => {
    expect([...ruLeaves.keys()].sort()).toEqual([...enLeaves.keys()].sort());
  });

  it("have no empty strings in Russian unless the English one is empty too", () => {
    const empty = [...ruLeaves].filter(([key, value]) => isEmpty(value) && !isEmpty(enLeaves.get(key)));
    expect(empty).toEqual([]);
  });

  it("use the same placeholders in both languages", () => {
    const mismatched = [...enLeaves]
      .filter(([key]) => !allowedToDrop.has(key))
      .filter(([key, value]) => placeholders(value).join() !== placeholders(ruLeaves.get(key)).join())
      .map(([key]) => key);
    expect(mismatched).toEqual([]);
  });

  it("have no long dashes", () => {
    const withDash = [...enLeaves, ...ruLeaves].filter(([, value]) => typeof value === "string" && value.includes("\u2014"));
    expect(withDash).toEqual([]);
  });
});

describe("agreed Russian wording", () => {
  it("keep the penthouse caption and statuses agreed for Russian", () => {
    expect(ru.floorPage.penthouse.replace("\u00a0", " ")).toBe("Пентхаус, с террасой");
    expect(ru.status).toEqual({ available: "Свободна", reserved: "Бронь", sold: "Продана" });
  });

  it("leave no English words in the Russian admin, apart from the brand and codes", () => {
    const allowed = /Aurora Residence|Meridian Group|\b(EN|RU|USD)\b/g;
    const english = leaves(adminRu)
      .filter(([key]) => !key.startsWith("locale."))
      .filter(([, value]) => typeof value === "string" && /[A-Za-z]{2,}/.test(value.replace(allowed, "").replace(/\{\w+\}/g, "")));
    expect(english).toEqual([]);
  });

  it("keep the admin labels agreed for Russian", () => {
    expect(adminRu.residences.penthouse.replace("\u00a0", " ")).toBe("Пентхаус, с террасой");
    expect(adminRu.residence.penthouse).toBe(adminRu.residences.penthouse);
    expect(adminRu.enquiries.statuses).toEqual({ NEW: "Новая", IN_PROGRESS: "В работе", CLOSED: "Закрыта" });
    expect(adminRu.residence.reservation.reserve).toBe("Забронировать на 7 дней");
    expect(adminRu.enquiry.residence.reserve).toBe("Забронировать на 7 дней");
    expect(adminRu.roles.ADMIN).toBe("Администратор");
    expect(adminRu.facade.statuses).toEqual({ AVAILABLE: "Свободна", RESERVED: "Бронь", SOLD: "Продана" });
  });
});
