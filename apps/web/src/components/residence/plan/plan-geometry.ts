import { planUnits } from "@/components/residences/floor/plan-units";

type Point = { x: number; y: number };

/** SVG matrix(a b c d e f): moves a source drawing so the residence box starts at 0,0. */
type Matrix = [number, number, number, number, number, number];

export type PlanGeometry = {
  source: "residence" | "floor";
  matrix: Matrix;
  width: number;
  height: number;
  /** Centres of the room labels in source coordinates, in the order of the layout rooms. */
  labels: Point[];
  entrance: Point;
  north: "up" | "left";
};

// "Residence 7.03 drawing" from Figma (Residences / Apartment 7.03), 678 x 528, 60 px per metre.
export const residenceDrawing = {
  lines:
    "M72 504H180M264 504H432M504 504H612M546 24V78C531.678 78 517.943 72.3107 507.816 62.1838C497.689 52.0568 492 38.3217 492 24M60 240V198C71.1391 198 81.822 202.425 89.6985 210.302C97.575 218.178 102 228.861 102 240M228 264H180C180 276.73 185.057 288.939 194.059 297.941C203.061 306.943 215.27 312 228 312M468 312H516C516 299.27 510.943 287.061 501.941 278.059C492.939 269.057 480.73 264 468 264M564 96H606C606 107.139 601.575 117.822 593.698 125.698C585.822 133.575 575.139 138 564 138M72 499H180V509H72V499ZM264 499H432V509H264V499ZM504 499H612V509H504V499Z",
  walls:
    "M19 499H72V509H19V499ZM180 499H264V509H180V499ZM432 499H504V509H432V499ZM612 499H659V509H612V499ZM20.5 20.5H492V27.5H20.5V20.5ZM546 20.5H657.5V27.5H546V20.5ZM20.5 20.5H27.5V507.5H20.5V20.5ZM650.5 20.5H657.5V507.5H650.5V20.5ZM178.25 22.25H181.75V241.75H178.25V22.25ZM22.25 238.25H60V241.75H22.25V238.25ZM102 238.25H229.75V241.75H102V238.25ZM226.25 238.25H229.75V264H226.25V238.25ZM226.25 312H229.75V505.75H226.25V312ZM466.25 22.25H469.75V60H466.25V22.25ZM466.25 144H469.75V264H466.25V144ZM466.25 312H469.75V505.75H466.25V312ZM466.25 238.25H655.75V241.75H466.25V238.25ZM562.25 22.25H565.75V96H562.25V22.25ZM562.25 138H565.75V241.75H562.25V138Z",
};

const RESIDENCE_BOX = { x: 24, y: 24, width: 630, height: 480 };
const residenceLabels: Point[] = [
  { x: 349, y: 360 },
  { x: 127, y: 384 },
  { x: 562, y: 384 },
  { x: 103, y: 132 },
  { x: 517, y: 198 },
  { x: 610, y: 180 },
];

// 04 is the mirrored plan of 03 (Figma, M / Residence Card), half a metre wider.
const WIDE = 11 / 10.5;

function floorCrop(position: number, rotate: boolean, labels: Point[], entrance: Point): PlanGeometry {
  const { x, y, width, height } = planUnits[position].rect;
  return rotate
    ? { source: "floor", matrix: [0, -1, 1, 0, -y, x + width], width: height, height: width, labels, entrance, north: "left" }
    : { source: "floor", matrix: [1, 0, 0, 1, -x, -y], width, height, labels, entrance, north: "up" };
}

/** Plans by position. 03 and 04 come from the Figma drawing of 7.03, the others are cut from the floor plan. */
export const planGeometry: Record<number, PlanGeometry> = {
  1: floorCrop(1, false, [{ x: 213, y: 58 }, { x: 180.6, y: 134 }, { x: 240, y: 125 }], { x: 243, y: 161.7 }),
  2: floorCrop(
    2,
    false,
    [{ x: 496.6, y: 70 }, { x: 572, y: 60 }, { x: 572, y: 136.5 }, { x: 496.6, y: 138 }],
    { x: 473, y: 161.7 },
  ),
  3: {
    source: "residence",
    matrix: [1, 0, 0, 1, -RESIDENCE_BOX.x, -RESIDENCE_BOX.y],
    width: RESIDENCE_BOX.width,
    height: RESIDENCE_BOX.height,
    labels: residenceLabels,
    entrance: { x: 520, y: 24 },
    north: "up",
  },
  4: {
    source: "residence",
    matrix: [-WIDE, 0, 0, 1, (RESIDENCE_BOX.x + RESIDENCE_BOX.width) * WIDE, -RESIDENCE_BOX.y],
    width: RESIDENCE_BOX.width * WIDE,
    height: RESIDENCE_BOX.height,
    labels: residenceLabels,
    entrance: { x: 520, y: 24 },
    north: "up",
  },
  5: floorCrop(
    5,
    true,
    [
      { x: 84, y: 294 },
      { x: 50, y: 65 },
      { x: 124, y: 65 },
      { x: 42, y: 170 },
      { x: 94, y: 180 },
      { x: 135.5, y: 150.5 },
      { x: 131.5, y: 200.5 },
    ],
    { x: 157.5, y: 180 },
  ),
  6: floorCrop(
    6,
    true,
    [
      { x: 687.75, y: 294 },
      { x: 723.75, y: 65 },
      { x: 645, y: 65 },
      { x: 732.75, y: 170 },
      { x: 676.5, y: 180 },
      { x: 625, y: 150 },
      { x: 640, y: 203 },
    ],
    { x: 609, y: 180 },
  ),
};

export function toPlan({ matrix: [a, b, c, d, e, f] }: PlanGeometry, { x, y }: Point): Point {
  return { x: a * x + c * y + e, y: b * x + d * y + f };
}
