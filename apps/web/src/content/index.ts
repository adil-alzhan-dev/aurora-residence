import { en, type Dictionary } from "./en";

export type Locale = "en";

const dictionaries: Record<Locale, Dictionary> = { en };

export function getDictionary(locale: Locale = "en"): Dictionary {
  return dictionaries[locale];
}

export type { AdvantageItem, Dictionary, GalleryItem, PlaceItem, StatItem } from "./en";
