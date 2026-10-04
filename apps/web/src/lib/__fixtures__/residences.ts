import type { Residence, ResidenceStatus } from "@/lib/api/residences";

/** Statuses of all 66 residences from spec.md, "Statuses of all 66 residences": floors 11 to 1, positions .01-.06. */
const statusRows: Record<number, string> = {
  11: "A A R A S A",
  10: "A S A A R A",
  9: "S A A R A A",
  8: "S A A R S A",
  7: "A S A R A A",
  6: "A A A S A A",
  5: "S A A A R A",
  4: "A S A A S A",
  3: "S A R A A S",
  2: "A S A S A R",
  1: "S A S A A S",
};

const statusByLetter: Record<string, ResidenceStatus> = { A: "available", R: "reserved", S: "sold" };

/** Position on the floor: bedrooms, area and the floor 7 price with its step per floor (spec, "Floor layout"). */
const layouts = [
  { bedrooms: 0, areaM2: 38.2, price7: 95_000, step: 2_000, side: "north" },
  { bedrooms: 1, areaM2: 51.8, price7: 134_000, step: 2_000, side: "north" },
  { bedrooms: 2, areaM2: 84.2, price7: 218_000, step: 4_000, side: "south" },
  { bedrooms: 2, areaM2: 87.6, price7: 226_000, step: 4_000, side: "south" },
  { bedrooms: 3, areaM2: 118.5, price7: 298_000, step: 5_000, side: "west" },
  { bedrooms: 3, areaM2: 126.3, price7: 318_000, step: 6_000, side: "east" },
] as const;

export const allResidences: Residence[] = Object.entries(statusRows).flatMap(([floorKey, row]) => {
  const floor = Number(floorKey);
  return row.split(" ").map((letter, index) => {
    const layout = layouts[index];
    return {
      number: `${floor}.0${index + 1}`,
      floor,
      position: index + 1,
      bedrooms: layout.bedrooms,
      areaM2: layout.areaM2,
      isPenthouse: false,
      priceUsd: layout.price7 + layout.step * (floor - 7),
      status: statusByLetter[letter],
      side: layout.side,
      view: layout.side === "south" ? "park" : "city",
    };
  });
});
