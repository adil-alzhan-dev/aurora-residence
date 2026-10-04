import { getResidences, type Residence } from "./api/residences";
import { countResult, matchesFilters, type ResidenceFilters } from "./residence-filters";
import { sortResidences, type ResidenceSort } from "./residence-sort";

const priceRangeOf = (residences: Residence[]) => {
  if (residences.length === 0) return null;
  const prices = residences.map((residence) => residence.priceUsd);
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

/**
 * The floor grid and the list: every residence once from the API, filtered here with the same
 * rule the facade uses for its muted floors, so all three views count the same way.
 */
export async function loadResidencesData(filters: ResidenceFilters, sort: ResidenceSort) {
  const all = await getResidences();
  if (!all) return { residences: null, matching: [], result: null, priceRange: null };

  const matching = all.filter((residence) => matchesFilters(residence, filters));
  return {
    residences: [...all].sort((a, b) => b.floor - a.floor || a.position - b.position),
    matching: sortResidences(matching, sort),
    result: countResult(all, matching),
    priceRange: priceRangeOf(all),
  };
}

export type ResidencesData = Awaited<ReturnType<typeof loadResidencesData>>;
