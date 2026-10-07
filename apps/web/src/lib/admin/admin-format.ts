import { fillTemplate } from "@/lib/format";
import { plural, type PluralForms } from "@/lib/plural";

const NBSP = " ";

/** Russian dates end with "г."; the admin stops at the year so a date can end a sentence. */
function upToYear(format: Intl.DateTimeFormat, date: Date) {
  const parts = format.formatToParts(date);
  const year = parts.findIndex((part) => part.type === "year");
  return parts
    .slice(0, year === -1 ? parts.length : year + 1)
    .map((part) => part.value)
    .join("");
}

function createAdminFormat(intl: string) {
  const money = new Intl.NumberFormat(intl, {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  });
  const decimal = new Intl.NumberFormat(intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const time = new Intl.DateTimeFormat(intl, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const shortDate = new Intl.DateTimeFormat(intl, { month: "short", day: "numeric" });
  const longDate = new Intl.DateTimeFormat(intl, { month: "long", day: "numeric", year: "numeric" });
  const day = new Intl.DateTimeFormat(intl, { month: "short", day: "numeric", year: "numeric" });

  return {
    intl,
    /** Prices stay in dollars; thousands are split by a space in every language: "$218 000", "218 000 $". */
    price: (amountUsd: number) => money.format(Math.round(amountUsd)).replaceAll(",", NBSP),
    decimal: (value: number) => decimal.format(value),
    time: (date: Date) => time.format(date),
    shortDate: (date: Date) => shortDate.format(date),
    longDate: (date: Date) => upToYear(longDate, date),
    day: (date: Date) => upToYear(day, date),
    dayTime: (date: Date) => `${upToYear(day, date)}, ${time.format(date)}`,
    /** The word form for the count with {count} filled in: "3 попытки", "1 attempt". */
    count: (count: number, forms: PluralForms) => fillTemplate(plural(count, forms, intl), { count }),
  };
}

export type AdminFormat = ReturnType<typeof createAdminFormat>;

const formats = new Map<string, AdminFormat>();

export function adminFormat(intl: string): AdminFormat {
  let format = formats.get(intl);
  if (!format) {
    format = createAdminFormat(intl);
    formats.set(intl, format);
  }
  return format;
}
