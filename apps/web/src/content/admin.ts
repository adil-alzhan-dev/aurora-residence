import { DEFAULT_LOCALE, type Locale } from "@/lib/locale";

import { adminEn, type AdminDictionary } from "./en-admin";
import { adminRu } from "./ru-admin";

const dictionaries: Record<Locale, AdminDictionary> = { en: adminEn, ru: adminRu };

export function getAdminDictionaryFor(locale: Locale = DEFAULT_LOCALE): AdminDictionary {
  return dictionaries[locale];
}

export type { AdminDictionary } from "./en-admin";
