export const FLOOR_COUNT = 11;

export const RESIDENCES_PER_FLOOR = 6;

export const floorNumbers = Array.from({ length: FLOOR_COUNT }, (_, index) => index + 1);

export const isFloorNumber = (value: number) => Number.isInteger(value) && value >= 1 && value <= FLOOR_COUNT;
