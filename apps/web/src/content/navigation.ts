import type { Dictionary } from "./en";

export type SectionId = keyof Dictionary["nav"];

export const sectionIds: SectionId[] = ["about", "residences", "gallery", "location", "progress", "contacts"];

export const sectionHref = (id: SectionId) => `#${id}`;

export const contactLinks = {
  phone: "tel:+15550102040",
  email: "mailto:sales@aurora-residence.com",
};
