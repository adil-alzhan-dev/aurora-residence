import type { AdminDictionary } from "@/content/en-admin";
import { fillTemplate, formatUsd } from "@/lib/format";

import { calendarDaysLeft, formatShortDate } from "./dashboard-view";
import type { EnquiryActivity, EnquiryCard } from "./schemas";

const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** "today at 09:02", "yesterday at 18:40" or "on Oct 2 at 16:22", as the manager reads it. */
export function receivedWhen(date: Date, now: Date, t: AdminDictionary["enquiry"]) {
  const time = timeFormat.format(date);
  const days = calendarDaysLeft(now, date);
  if (days === 0) return fillTemplate(t.receivedToday, { time });
  if (days === 1) return fillTemplate(t.receivedYesterday, { time });
  return fillTemplate(t.receivedOn, { date: formatShortDate(date), time });
}

export function receivedLine(card: Pick<EnquiryCard, "createdAt" | "source" | "residence">, now: Date, t: AdminDictionary["enquiry"]) {
  const received = fillTemplate(t.received, { when: receivedWhen(card.createdAt, now, t) });
  if (!card.residence) return `${received} ${t.general}`;
  const origin = card.source.startsWith("Residence page") ? t.fromResidencePage : t.aboutResidence;
  return `${received} ${fillTemplate(origin, { number: card.residence.number })}`;
}

export type ActivityLine = { text: string; note: string | null };

type ActivityTexts = {
  activity: AdminDictionary["enquiry"]["activity"];
  enquiryStatuses: AdminDictionary["enquiries"]["statuses"];
  residenceStatuses: AdminDictionary["facade"]["statuses"];
};

const label = (labels: Record<string, string>, value: string | null) => (value ? (labels[value] ?? value) : "");

const formatPrice = (value: string | null) => (value && /^\d+$/.test(value) ? formatUsd(Number(value)) : (value ?? ""));

/** One plain sentence per entry; the note of a status change is shown under it. */
export function activityLine(entry: EnquiryActivity, t: ActivityTexts): ActivityLine {
  const { activity } = t;
  const number = entry.residence ?? entry.to ?? "";
  switch (entry.type) {
    case "ENQUIRY_RECEIVED":
      return { text: entry.note ?? activity.received, note: null };
    case "ENQUIRY_STATUS_CHANGED":
      return {
        text: fillTemplate(activity.statusChanged, {
          from: label(t.enquiryStatuses, entry.from),
          to: label(t.enquiryStatuses, entry.to),
        }),
        note: entry.note,
      };
    case "NOTE_ADDED":
      return { text: activity.noteAdded, note: null };
    case "ENQUIRY_RESIDENCE_LINKED":
      return { text: fillTemplate(activity.residenceLinked, { number: entry.to ?? number }), note: null };
    case "PRICE_CHANGED":
      return {
        text: fillTemplate(activity.priceChanged, { number, from: formatPrice(entry.from), to: formatPrice(entry.to) }),
        note: entry.note,
      };
    default: {
      const to = label(t.residenceStatuses, entry.to);
      const text = entry.from
        ? fillTemplate(activity.residenceStatus, { number, from: label(t.residenceStatuses, entry.from), to })
        : fillTemplate(activity.residenceListed, { number, to });
      return { text, note: entry.note };
    }
  }
}

/** The newest "Note added" entry says when and by whom the current note was saved. */
export function lastNoteSave(activity: EnquiryActivity[]) {
  const entry = activity.find((item) => item.type === "NOTE_ADDED");
  return entry ? { at: entry.at, author: entry.author } : null;
}
