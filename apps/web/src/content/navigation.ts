import type { Dictionary } from "./en";

export type SectionId = keyof Dictionary["nav"];

export const sectionIds: SectionId[] = ["about", "residences", "gallery", "location", "progress", "contacts"];

// Absolute, so the same links work from the residence pages and lead back to the home sections.
export const sectionHref = (id: SectionId) => `/#${id}`;

export const contactLinks = {
  phone: "tel:+15550102040",
  email: "mailto:sales@aurora-residence.com",
};

export type ResidenceView = "facade" | "grid" | "list";

export const residencesHref = "/residences";

export const residencesViewHref = (view: ResidenceView) =>
  view === "facade" ? residencesHref : `${residencesHref}?view=${view}`;

export const floorHref = (floor: number) => `${residencesHref}/floor/${floor}`;

export const residenceHref = (number: string) => `${residencesHref}/${number}`;

export type HeaderVariant = "overlay" | "dark" | "light";

/**
 * Home starts transparent over the hero, other dark pages keep the hairline, light pages start solid.
 * On /residences only the facade is dark: the floor grid and the list are light pages.
 */
export function headerVariant(pathname: string, view: string | null = null): HeaderVariant {
  if (pathname === "/") return "overlay";
  if (pathname.startsWith(`${residencesHref}/floor/`)) return "light";
  if (pathname === residencesHref && (view === "grid" || view === "list")) return "light";
  return "dark";
}
