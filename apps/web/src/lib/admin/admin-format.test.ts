import { describe, expect, it } from "vitest";

import { pluralForms } from "@/lib/plural";

import { adminFormat } from "./admin-format";

const NBSP = " ";
const date = new Date(2026, 9, 7, 9, 2);
const en = adminFormat("en-US");
const ru = adminFormat("ru-RU");

describe("adminFormat", () => {
  it("keeps prices in dollars with spaced thousands in both languages", () => {
    expect(en.price(218_000)).toBe(`$218${NBSP}000`);
    expect(ru.price(218_000)).toBe(`218${NBSP}000${NBSP}$`);
    expect(en.price(1_250_000.4)).toBe(`$1${NBSP}250${NBSP}000`);
  });

  it("writes decimals with the reader's separator", () => {
    expect(en.decimal(84.2)).toBe("84.2");
    expect(ru.decimal(84.2)).toBe("84,2");
    expect(ru.decimal(3.2)).toBe("3,2");
  });

  it("writes dates without the Russian year suffix, so they can end a sentence", () => {
    const spaced = (text: string) => text.replaceAll(NBSP, " ");
    expect(spaced(en.shortDate(date))).toBe("Oct 7");
    expect(spaced(ru.shortDate(date))).toBe("7 окт.");
    expect(spaced(en.longDate(date))).toBe("October 7, 2026");
    expect(spaced(ru.longDate(date))).toBe("7 октября 2026");
    expect(spaced(ru.day(date))).toBe("7 окт. 2026");
    expect(spaced(en.dayTime(date))).toBe("Oct 7, 2026, 09:02");
    expect(spaced(ru.dayTime(date))).toBe("7 окт. 2026, 09:02");
  });

  it("keeps a date on one line", () => {
    expect(ru.day(date)).toBe(`7${NBSP}окт.${NBSP}2026`);
    expect(ru.dayTime(date)).toBe(`7${NBSP}окт.${NBSP}2026, 09:02`);
  });

  it("picks the word form for the count", () => {
    const days = pluralForms("через {count} день", "через {count} дня", "через {count} дней");
    expect([1, 2, 5, 11, 21, 22].map((count) => ru.count(count, days))).toEqual([
      "через 1 день",
      "через 2 дня",
      "через 5 дней",
      "через 11 дней",
      "через 21 день",
      "через 22 дня",
    ]);
    expect(en.count(1, pluralForms("{count} attempt", "{count} attempts"))).toBe("1 attempt");
  });
});
