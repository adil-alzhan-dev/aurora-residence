import { DEFAULT_LOCALE, type Locale } from "@/lib/locale";

import { en, type Dictionary } from "./en";
import { ru } from "./ru";

const dictionaries: Record<Locale, Dictionary> = { en, ru };

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale];
}

export type { AdvantageItem, Dictionary, GalleryItem, PlaceItem, StatItem } from "./en";
