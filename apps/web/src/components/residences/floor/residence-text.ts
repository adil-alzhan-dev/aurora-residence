import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate, formatArea } from "@/lib/format";

type FloorText = Dictionary["floorPage"];

export const areaText = (residence: Residence, t: FloorText) =>
  fillTemplate(t.area, { area: formatArea(residence.areaM2) });

/** "Two-bedroom, 84.2 m²" */
export const typeAreaText = (residence: Residence, t: FloorText) =>
  fillTemplate(t.typeArea, { type: t.typeNames[residence.bedrooms] ?? "", area: areaText(residence, t) });

/** Table column: "Studio" or the number of bedrooms. */
export const bedroomsText = (residence: Residence, t: FloorText) =>
  residence.bedrooms === 0 ? t.studio : String(residence.bedrooms);

/** Mobile row: "Studio" or "2 bd". */
export const bedroomsShortText = (residence: Residence, t: FloorText) =>
  residence.bedrooms === 0 ? t.studio : fillTemplate(t.bedroomsShort, { count: residence.bedrooms });

export const isOpenable = (residence: Residence) => residence.status !== "sold";
