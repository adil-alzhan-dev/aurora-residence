import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { PLAN_HEIGHT, PLAN_WIDTH, planLines, planWalls } from "@/components/residences/floor/plan-drawing";
import { planUnits } from "@/components/residences/floor/plan-units";
import type { Dictionary } from "@/content";
import { floorHref } from "@/content/navigation";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate } from "@/lib/format";

type FloorPositionProps = {
  residence: Residence;
  t: Dictionary["residencePage"]["position"];
};

/** Key plan: the whole floor with this residence filled in bronze, linked to the floor page. */
export function FloorPosition({ residence, t }: FloorPositionProps) {
  const unit = planUnits[residence.position];
  if (!unit) return null;
  const values = { floor: residence.floor, number: residence.number };

  return (
    <div className="flex items-center gap-6 border-t border-border pt-6">
      <svg
        viewBox={`0 0 ${PLAN_WIDTH} ${PLAN_HEIGHT}`}
        role="img"
        aria-label={fillTemplate(t.label, values)}
        className="w-2/5 max-w-60 shrink-0 text-foreground"
      >
        <rect {...unit.rect} className="fill-primary/25" />
        <path d={planLines} vectorEffect="non-scaling-stroke" className="fill-none stroke-current" />
        <path d={planWalls} className="fill-current" />
        <rect {...unit.rect} vectorEffect="non-scaling-stroke" className="fill-none stroke-primary [stroke-width:2]" />
      </svg>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-overline text-muted-foreground">{fillTemplate(t.title, values)}</p>
        <p className="text-caption text-muted-foreground">{t.sides[residence.side]}</p>
        <Link
          href={floorHref(residence.floor)}
          className="group flex min-h-11 items-center gap-3 text-label text-foreground transition-colors duration-200 hover:text-primary"
        >
          {fillTemplate(t.open, values)}
          <ArrowRightIcon className="shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
