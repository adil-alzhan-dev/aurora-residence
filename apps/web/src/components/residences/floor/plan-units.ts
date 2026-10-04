import { PLAN_HEIGHT, PLAN_WIDTH } from "./plan-drawing";

type Box = { x: number; y: number; width: number; height: number };

export type PlanUnit = {
  rect: Box;
  /** Top centre of the number and area label in the desktop plan, as placed in Figma. */
  label: { x: number; y: number };
};

/** Residences by position on the typical floor, in plan coordinates (see spec, "Floor layout"). */
export const planUnits: Record<number, PlanUnit> = {
  1: { rect: { x: 157.5, y: 10.5, width: 111.3, height: 151.2 }, label: { x: 213.15, y: 23.2 } },
  2: { rect: { x: 457.8, y: 10.5, width: 151.2, height: 151.2 }, label: { x: 496.65, y: 50.5 } },
  3: { rect: { x: 157.5, y: 199.5, width: 220.5, height: 168 }, label: { x: 270.9, y: 285.7 } },
  4: { rect: { x: 378, y: 199.5, width: 231, height: 168 }, label: { x: 491.4, y: 285.7 } },
  5: { rect: { x: 10.5, y: 10.5, width: 147, height: 357 }, label: { x: 84, y: 264.7 } },
  6: { rect: { x: 609, y: 10.5, width: 157.5, height: 357 }, label: { x: 693, y: 264.7 } },
};

export const planX = (x: number) => `${(x / PLAN_WIDTH) * 100}%`;

export const planY = (y: number) => `${(y / PLAN_HEIGHT) * 100}%`;

export const unitCenter = ({ rect }: PlanUnit) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

export const boxStyle = ({ x, y, width, height }: Box) => ({
  left: planX(x),
  top: planY(y),
  width: planX(width),
  height: planY(height),
});
