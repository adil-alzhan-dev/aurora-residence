import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate, formatDecimal } from "@/lib/format";

export type FloorText = Pick<Dictionary, "floorPage" | "locale">;

/** "84.2 m²" or "84,2 м²" */
export const areaLabel = (areaM2: number, t: FloorText) =>
  fillTemplate(t.floorPage.area, { area: formatDecimal(areaM2, t.locale.intl) });

export const areaText = (residence: Residence, t: FloorText) => areaLabel(residence.areaM2, t);

/** "Two-bedroom, 84.2 m²" */
export const typeAreaText = (residence: Residence, t: FloorText) =>
  fillTemplate(t.floorPage.typeArea, { type: t.floorPage.typeNames[residence.bedrooms] ?? "", area: areaText(residence, t) });

/** Table column: "Studio" or the number of bedrooms. */
export const bedroomsText = (residence: Residence, t: Dictionary["floorPage"]) =>
  residence.bedrooms === 0 ? t.studio : String(residence.bedrooms);

/** Mobile row: "Studio" or "2 bd". */
export const bedroomsShortText = (residence: Residence, t: Dictionary["floorPage"]) =>
  residence.bedrooms === 0 ? t.studio : fillTemplate(t.bedroomsShort, { count: residence.bedrooms });

export const isOpenable = (residence: Residence) => residence.status !== "sold";
