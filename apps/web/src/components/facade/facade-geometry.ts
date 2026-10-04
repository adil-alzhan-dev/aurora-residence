import { FLOOR_COUNT } from "@/lib/building";

export const FACADE_WIDTH = 1536;
export const FACADE_HEIGHT = 1024;

const GROUND_Y = 716;
const FLOOR_HEIGHT = 58.5;
const HOUSE_LEFT = 357;
const HOUSE_RIGHT = 1172;

export const house = { left: HOUSE_LEFT, width: HOUSE_RIGHT - HOUSE_LEFT, floorHeight: FLOOR_HEIGHT };

export const floorsTopDown = Array.from({ length: FLOOR_COUNT }, (_, index) => FLOOR_COUNT - index);

export const floorTop = (floor: number) => GROUND_Y - floor * FLOOR_HEIGHT;

export const floorCenter = (floor: number) => floorTop(floor) + FLOOR_HEIGHT / 2;

export const toPercentX = (x: number) => `${(x / FACADE_WIDTH) * 100}%`;

export const toPercentY = (y: number) => `${(y / FACADE_HEIGHT) * 100}%`;

export const houseRightPercent = toPercentX(HOUSE_RIGHT);

export const defaultTapX = 871;
