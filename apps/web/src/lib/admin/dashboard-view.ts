import type { AdminDictionary } from "@/content/en-admin";
import { fillTemplate, formatArea, formatUsd } from "@/lib/format";

import type { AdminResidence } from "./schemas";

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Calendar days between today and the day the reservation ends, as the manager counts them. */
export function calendarDaysLeft(endsAt: Date, now: Date) {
  return Math.round((startOfDay(endsAt) - startOfDay(now)) / DAY_MS);
}

const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const shortDateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const longDateFormat = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

export const formatShortDate = (date: Date) => shortDateFormat.format(date);
export const formatLongDate = (date: Date) => longDateFormat.format(date);

export function formatReceived(date: Date, now: Date, t: AdminDictionary["enquiries"]) {
  const time = timeFormat.format(date);
  const days = calendarDaysLeft(now, date);
  if (days === 0) return fillTemplate(t.today, { time });
  if (days === 1) return fillTemplate(t.yesterday, { time });
  return `${formatShortDate(date)}, ${time}`;
}

export function residenceDetails(residence: AdminResidence, t: AdminDictionary["enquiries"]) {
  const bedrooms = residence.bedrooms === 0 ? t.studio : fillTemplate(t.bedrooms, { count: residence.bedrooms });
  return fillTemplate(t.details, {
    bedrooms,
    area: formatArea(residence.areaM2),
    price: formatUsd(residence.priceUsd),
  });
}

export type ReservationRow = {
  number: string;
  client: string | null;
  endsAt: Date;
  daysLeft: number;
  endingSoon: boolean;
};

/**
 * Every active reservation, soonest first. "Ending soon" is what the API counts as ending
 * within 48 hours, so the red rows always match the number on the Reserved card.
 */
export function reservationRows(
  residences: AdminResidence[],
  clients: Map<string, string | null>,
  endingSoon: Set<string>,
  now: Date,
): ReservationRow[] {
  return residences
    .filter((residence) => residence.status === "RESERVED" && residence.reservedUntil)
    .map((residence) => {
      const endsAt = residence.reservedUntil as Date;
      return {
        number: residence.number,
        client: clients.get(residence.number) ?? null,
        endsAt,
        daysLeft: calendarDaysLeft(endsAt, now),
        endingSoon: endingSoon.has(residence.number),
      };
    })
    .sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
}

export const percentOf = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);
