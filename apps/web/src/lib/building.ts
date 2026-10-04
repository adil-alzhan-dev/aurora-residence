import { notFound } from "next/navigation";

export const FLOOR_COUNT = 11;

export const RESIDENCES_PER_FLOOR = 6;

export const floorNumbers = Array.from({ length: FLOOR_COUNT }, (_, index) => index + 1);

export const isFloorNumber = (value: number) => Number.isInteger(value) && value >= 1 && value <= FLOOR_COUNT;

// Only plain floor numbers: "7" is a floor, "07", "7.0" or "12" are not.
const FLOOR_PARAM = /^(?:[1-9]|1[01])$/;

export function parseFloorParam(param: string) {
  if (!FLOOR_PARAM.test(param)) notFound();
  return Number(param);
}
