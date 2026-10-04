import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate } from "@/lib/format";

type ListText = Dictionary["list"];

/** "two-bedroom residences", or "studio" for one; any bedrooms reads as plain "residences". */
export function residenceNoun(count: number, bedrooms: number | null, t: ListText) {
  const [one, many] = (bedrooms === null ? t.nouns.any : t.nouns.byBedrooms[bedrooms]) ?? t.nouns.any;
  return count === 1 ? one : many;
}

/** "south, park" */
export const sideViewText = (residence: Residence, t: ListText) =>
  `${t.sides[residence.side]}, ${residence.view.toLowerCase()}`;

/** "Two-bedroom, south, park" */
export const descriptionText = (residence: Residence, t: Pick<Dictionary, "list" | "floorPage">) =>
  fillTemplate(t.list.description, {
    type: t.floorPage.typeNames[residence.bedrooms] ?? "",
    side: t.list.sides[residence.side],
    view: residence.view.toLowerCase(),
  });

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
