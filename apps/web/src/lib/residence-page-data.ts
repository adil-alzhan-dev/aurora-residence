import { getResidence, getResidences, type Residence } from "./api/residences";

const SIMILAR_COUNT = 3;

/** Same layout on the nearest floors, still for sale, shown in floor order as in Figma (5.03, 6.03, 8.03). */
export function similarResidences(residence: Residence, all: Residence[]) {
  const forSale = all.filter((other) => other.number !== residence.number && other.status !== "sold");
  const byDistance = (list: Residence[]) =>
    [...list].sort((a, b) => Math.abs(a.floor - residence.floor) - Math.abs(b.floor - residence.floor) || a.floor - b.floor);
  const sameLayout = byDistance(forSale.filter((other) => other.position === residence.position));
  const sameSize = byDistance(
    forSale.filter((other) => other.position !== residence.position && other.bedrooms === residence.bedrooms),
  );
  return [...sameLayout, ...sameSize].slice(0, SIMILAR_COUNT).sort((a, b) => a.floor - b.floor || a.position - b.position);
}

/**
 * The residence from /api/residences/<number> and the whole house from /api/residences for the similar
 * residences and the floor plan, both fresh on every request.
 */
export async function loadResidencePage(number: string) {
  const [residence, all] = await Promise.all([getResidence(number), getResidences()]);
  if (!residence) return null;
  const house = all ?? [];
  return {
    residence,
    floorResidences: house.filter((other) => other.floor === residence.floor).sort((a, b) => a.position - b.position),
    similar: similarResidences(residence, house),
  };
}

export type ResidencePageData = NonNullable<Awaited<ReturnType<typeof loadResidencePage>>>;
