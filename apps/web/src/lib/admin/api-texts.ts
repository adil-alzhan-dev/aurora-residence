import type { AdminDictionary } from "@/content/en-admin";
import { fillTemplate } from "@/lib/format";

import type { AdminFormat } from "./admin-format";

type Messages = AdminDictionary["messages"];
type ApiKey = keyof Messages["api"];
type NoteKey = Exclude<keyof Messages["notes"], "known">;

const NUMBER = String.raw`(?<number>\d{1,2}\.\d{2})`;

/** Messages of 400 and 409 answers that are worth showing; anything else gets the general text. */
const API_MESSAGES: [RegExp, ApiKey][] = [
  [new RegExp(String.raw`^Enquiry \d+ has no residence\. Link it to ${NUMBER} before reserving`), "enquiryNoResidence"],
  [
    new RegExp(String.raw`^Enquiry \d+ is about residence (?<other>\d{1,2}\.\d{2}), not ${NUMBER}\.`),
    "enquiryOtherResidence",
  ],
  [/^Enquiry \d+ is closed/, "enquiryClosed"],
  [/^Enquiry \d+ not found$/, "enquiryNotFound"],
  [new RegExp(String.raw`^Residence ${NUMBER} (not found|does not exist)$`), "residenceNotFound"],
  [new RegExp(String.raw`^Residence ${NUMBER} has no active reservation$`), "noActiveReservation"],
  [new RegExp(String.raw`^Residence ${NUMBER} is \w+, only an available residence can be reserved$`), "notAvailable"],
  [new RegExp(String.raw`^Residence ${NUMBER} is no longer \w+, someone has just changed it`), "changedMeanwhile"],
  [new RegExp(String.raw`^Residence ${NUMBER} can be reserved only for an enquiry`), "reserveFromEnquiry"],
];

/** Notes the API and the demo data write into the history by themselves. */
const NOTES: [RegExp, NoteKey][] = [
  [new RegExp(String.raw`^Enquiry received from the site, residence ${NUMBER} stays Available$`), "received"],
  [
    new RegExp(String.raw`^Enquiry received from the site, residence ${NUMBER} is (?<status>\w+), status not changed$`),
    "receivedWithStatus",
  ],
  [/^Enquiry received from the site, no residence selected$/, "receivedGeneral"],
  [/^Reserved for 7 days$/, "reserved"],
  [/^Reserved for 7 days, enquiry from (?<name>.+)$/, "reservedFor"],
  [/^Reservation ended after 7 days without a deal$/, "expired"],
  [/^Reservation released by manager$/, "released"],
  [/^Back on sale$/, "backOnSale"],
  [/^Contract signed$/, "sold"],
  [/^Residence reserved for this enquiry$/, "reservedForEnquiry"],
  [new RegExp(String.raw`^Residence ${NUMBER} linked to the enquiry$`), "linked"],
  [/^Sales start, listed at \$(?<price>[\d\s,]+)$/, "salesStart"],
];

function findMatch<Key extends string>(text: string, rules: [RegExp, Key][]) {
  for (const [pattern, key] of rules) {
    const match = pattern.exec(text);
    if (match) return { key, groups: match.groups ?? {} };
  }
  return null;
}

/** The API's own words for a refusal, in the reader's language; null for a message the admin does not know. */
export function apiMessageText(message: string, t: Messages["api"]): string | null {
  const match = findMatch(message, API_MESSAGES);
  return match ? fillTemplate(t[match.key], match.groups) : null;
}

type NoteTexts = { messages: Messages; statuses: AdminDictionary["facade"]["statuses"] };

/** A note written by the system is translated; a note a manager typed stays as it was written. */
export function noteText(note: string, t: NoteTexts, format: AdminFormat): string {
  const known = t.messages.notes.known[note];
  if (known) return known;
  const match = findMatch(note, NOTES);
  if (!match) return note;
  const { status, price, ...groups } = match.groups;
  const values: Record<string, string> = { ...groups };
  if (status) values.status = t.statuses[status.toUpperCase() as keyof NoteTexts["statuses"]] ?? status;
  if (price) values.price = format.price(Number(price.replace(/\D/g, "")));
  return fillTemplate(t.messages.notes[match.key], values);
}

export const authorText = (author: string, t: Messages) => (author === "System" ? t.system : author);

/** The stored source stays "Contacts form", "Residence page" and so on; only its label is translated. */
export const sourceText = (source: string, t: Messages) => t.sources[source] ?? source;
