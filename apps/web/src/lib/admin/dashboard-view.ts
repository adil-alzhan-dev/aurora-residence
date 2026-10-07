import type { AdminDictionary } from "@/content/en-admin";
import { fillTemplate } from "@/lib/format";

import type { AdminFormat } from "./admin-format";
import type { DashboardSummary, ResidenceBrief } from "./schemas";

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Calendar days between today and the day the reservation ends, as the manager counts them. */
export function calendarDaysLeft(endsAt: Date, now: Date) {
  return Math.round((startOfDay(endsAt) - startOfDay(now)) / DAY_MS);
}

/** "Today, 11:48", "Yesterday, 18:40" or "Oct 2, 16:22" in the list columns. */
export function formatReceived(date: Date, now: Date, t: AdminDictionary["enquiries"], format: AdminFormat) {
  const time = format.time(date);
  const days = calendarDaysLeft(now, date);
  if (days === 0) return fillTemplate(t.today, { time });
  if (days === 1) return fillTemplate(t.yesterday, { time });
  return fillTemplate(t.earlier, { date: format.shortDate(date), time });
}

export function residenceDetails(residence: ResidenceBrief, t: AdminDictionary["enquiries"], format: AdminFormat) {
  const bedrooms = residence.bedrooms === 0 ? t.studio : fillTemplate(t.bedrooms, { count: residence.bedrooms });
  return fillTemplate(t.details, {
    bedrooms,
    area: format.decimal(residence.areaM2),
    price: format.price(residence.priceUsd),
  });
}

export type ReservationRow = {
  number: string;
  client: string | null;
  endsAt: Date;
  daysLeft: number;
  endingSoon: boolean;
};

/** The API sends active reservations soonest first and decides which ones end within 48 hours. */
export function reservationRows(reservations: DashboardSummary["reservations"], now: Date): ReservationRow[] {
  return reservations.map((reservation) => ({
    number: reservation.residence,
    client: reservation.client,
    endsAt: reservation.expiresAt,
    daysLeft: calendarDaysLeft(reservation.expiresAt, now),
    endingSoon: reservation.endingSoon,
  }));
}

export const percentOf = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);
