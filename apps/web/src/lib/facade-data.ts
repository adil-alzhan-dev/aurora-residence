import { getFloorSummaries, type FloorSummary } from "./api/floors";
import { getResidences } from "./api/residences";
import { floorNumbers } from "./building";
import {
  activeFilterCount,
  countResult,
  matchesFilters,
  summarizeFloors,
  type ResidenceFilters,
} from "./residence-filters";

const PREFERRED_FLOOR = 7;

/** Floor 7 as in Figma, unless the filters point elsewhere: then the nearest floor with a match. */
function pickInitialFloor(filters: ResidenceFilters, summaries: FloorSummary[] | null) {
  if (filters.floor !== null) return filters.floor;
  if (!summaries) return PREFERRED_FLOOR;
  const withMatches = new Set(summaries.filter((summary) => summary.available > 0).map((summary) => summary.floor));
  const byDistance = [...floorNumbers].sort(
    (a, b) => Math.abs(a - PREFERRED_FLOOR) - Math.abs(b - PREFERRED_FLOOR) || b - a,
  );
  return byDistance.find((floor) => withMatches.has(floor)) ?? PREFERRED_FLOOR;
}

/** Everything the residence selection pages need, loaded fresh from the API on each request. */
export async function loadFacadeData(filters: ResidenceFilters) {
  const filtered = activeFilterCount(filters) > 0;
  const [floors, all, matching] = await Promise.all([
    getFloorSummaries(),
    getResidences(),
    filtered ? getResidences(filters) : null,
  ]);

  const matchingList = filtered ? matching : all;
  const summaries = filtered ? matching && summarizeFloors(matching) : (floors ?? (all && summarizeFloors(all)));
  const prices = all?.map((residence) => residence.priceUsd) ?? [];

  return {
    summaries,
    result: all && matchingList ? countResult(all, matchingList) : null,
    priceRange: prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
    cells:
      all
        ?.map((residence) => ({
          number: residence.number,
          floor: residence.floor,
          position: residence.position,
          status: residence.status,
          matches: matchesFilters(residence, filters),
        }))
        .sort((a, b) => a.floor - b.floor || a.position - b.position) ?? [],
    initialFloor: pickInitialFloor(filters, summaries),
  };
}
