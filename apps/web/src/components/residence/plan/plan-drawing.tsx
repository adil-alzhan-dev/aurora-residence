import { planLines, planWalls } from "@/components/residences/floor/plan-drawing";
import { cn } from "@/lib/utils";

import { planGeometry, residenceDrawing, type PlanGeometry } from "./plan-geometry";

/** Half an outer wall around the residence box, so the walls are drawn whole. */
export const wallPad = (geometry: PlanGeometry) => (geometry.source === "floor" ? 2.5 : 5);

export const planAspect = (geometry: PlanGeometry) =>
  (geometry.width + 2 * wallPad(geometry)) / (geometry.height + 2 * wallPad(geometry));

type ResidenceDrawingProps = {
  position: number;
  className?: string;
};

/** The walls, doors and windows of one layout, decorative: the text around it names the residence. */
export function ResidenceDrawing({ position, className }: ResidenceDrawingProps) {
  const geometry = planGeometry[position];
  if (!geometry) return null;
  const pad = wallPad(geometry);
  const paths = geometry.source === "floor" ? { lines: planLines, walls: planWalls } : residenceDrawing;

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${geometry.width + 2 * pad} ${geometry.height + 2 * pad}`}
      aria-hidden="true"
      className={cn("block text-foreground", className)}
    >
      <g transform={`matrix(${geometry.matrix.join(" ")})`}>
        <path d={paths.lines} vectorEffect="non-scaling-stroke" className="fill-none stroke-current [stroke-width:1.25]" />
        <path d={paths.walls} className="fill-current" />
      </g>
    </svg>
  );
}
