import { cn } from "@/lib/utils";

import { planLines, planWalls } from "../floor/plan-drawing";
import { planUnits } from "../floor/plan-units";

// Half a wall around the residence, so its outer walls stay whole.
const MARGIN = 2.5;

type MiniPlanProps = {
  position: number;
  /** Without a label the drawing is decorative, for cards that already name the residence. */
  label?: string;
  className?: string;
};

/** The residence cut out of the typical floor drawing, so every position shows its own plan. */
export function MiniPlan({ position, label, className }: MiniPlanProps) {
  const unit = planUnits[position];
  if (!unit) return null;
  const { x, y, width, height } = unit.rect;
  const viewBox = `${x - MARGIN} ${y - MARGIN} ${width + 2 * MARGIN} ${height + 2 * MARGIN}`;

  return (
    <svg
      viewBox={viewBox}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("text-foreground", className)}
    >
      <path d={planLines} vectorEffect="non-scaling-stroke" className="fill-none stroke-current" />
      <path d={planWalls} className="fill-current" />
    </svg>
  );
}
