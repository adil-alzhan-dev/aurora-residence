import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate } from "@/lib/format";
import { plural } from "@/lib/plural";

type ListText = Dictionary["list"];

/** "two-bedroom residences", or "studio" for one; any bedrooms reads as plain "residences". */
export function residenceNoun(count: number, bedrooms: number | null, t: Pick<Dictionary, "list" | "locale">) {
  const { nouns } = t.list;
  const forms = (bedrooms === null ? nouns.any : nouns.byBedrooms[bedrooms]) ?? nouns.any;
  return plural(count, forms, t.locale.intl);
}

/** The view as the API names it ("Park and city"), in the reader's language. */
export function viewText(residence: Residence, t: ListText) {
  const view = residence.view.toLowerCase();
  return t.views[view] ?? view;
}

/** "south, park" */
export const sideViewText = (residence: Residence, t: ListText) => `${t.sides[residence.side]}, ${viewText(residence, t)}`;

/** "Two-bedroom, south, park" */
export const descriptionText = (residence: Residence, t: Pick<Dictionary, "list" | "floorPage">) =>
  fillTemplate(t.list.description, {
    type: t.floorPage.typeNames[residence.bedrooms] ?? "",
    side: t.list.sides[residence.side],
    view: viewText(residence, t.list),
  });

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
