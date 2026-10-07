"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent, PointerEvent } from "react";

import { residenceHref } from "@/content/navigation";
import type { Residence, ResidenceStatus } from "@/lib/api/residences";
import { cn } from "@/lib/utils";

import { PlanHoverCard } from "./plan-hover-card";
import { PLAN_HEIGHT, PLAN_WIDTH, planLines, planWalls } from "./plan-drawing";
import { boxStyle, planUnits, planX, planY, unitCenter } from "./plan-units";
import { areaText, isOpenable, typeAreaText, type FloorText } from "./residence-text";

export type PlanPoint = { x: number; y: number };

const fillTone: Record<ResidenceStatus, { idle: string; active: string }> = {
  available: { idle: "fill-status-free-subtle", active: "fill-status-free/22" },
  reserved: { idle: "fill-status-reserved-subtle", active: "fill-status-reserved/22" },
  sold: { idle: "fill-status-sold-subtle", active: "fill-status-sold/22" },
};

type FloorPlanProps = {
  residences: Residence[];
  active: string | null;
  point: PlanPoint | null;
  onActivate: (number: string, point: PlanPoint) => void;
  onLeave: () => void;
  t: FloorText;
};

export function FloorPlan({ residences, active, point, onActivate, onLeave, t }: FloorPlanProps) {
  const router = useRouter();
  const activeResidence = residences.find((residence) => residence.number === active);

  const toPlanPoint = (event: PointerEvent<SVGElement>): PlanPoint => {
    const box =
      event.currentTarget.ownerSVGElement?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * PLAN_WIDTH,
      y: ((event.clientY - box.top) / box.height) * PLAN_HEIGHT,
    };
  };

  const open = (event: MouseEvent, residence: Residence) => {
    event.preventDefault();
    router.push(residenceHref(residence.number));
  };

  return (
    <div className="relative aspect-[777/378] w-full" onPointerLeave={onLeave}>
      <svg viewBox={`0 0 ${PLAN_WIDTH} ${PLAN_HEIGHT}`} className="absolute inset-0 size-full overflow-visible">
        {residences.map((residence) => {
          const unit = planUnits[residence.position];
          if (!unit) return null;
          const tone = fillTone[residence.status];
          return (
            <rect
              key={residence.number}
              {...unit.rect}
              className={cn("transition-[fill] duration-200", residence.number === active ? tone.active : tone.idle)}
            />
          );
        })}
        <path d={planLines} className="fill-none stroke-foreground" />
        <path d={planWalls} className="fill-foreground" />
        {activeResidence && isOpenable(activeResidence) && planUnits[activeResidence.position] && (
          <rect
            {...planUnits[activeResidence.position].rect}
            vectorEffect="non-scaling-stroke"
            className="pointer-events-none fill-none stroke-primary [stroke-width:2]"
          />
        )}
        {residences.map((residence) => {
          const unit = planUnits[residence.position];
          if (!unit) return null;
          const label = [
            residence.number,
            typeAreaText(residence, t),
            t.floorPage[residence.status === "sold" ? "notForSale" : "clickToOpen"],
          ];
          const hitArea = (
            <rect
              {...unit.rect}
              fill="transparent"
              onPointerEnter={(event) => onActivate(residence.number, toPlanPoint(event))}
              onPointerMove={(event) => onActivate(residence.number, toPlanPoint(event))}
            />
          );
          return isOpenable(residence) ? (
            <a
              key={residence.number}
              href={residenceHref(residence.number)}
              aria-label={label.join(", ")}
              onClick={(event) => open(event, residence)}
              onFocus={() => onActivate(residence.number, unitCenter(unit))}
              onBlur={onLeave}
              className="cursor-pointer outline-none [-webkit-tap-highlight-color:transparent]"
            >
              {hitArea}
            </a>
          ) : (
            <g key={residence.number} aria-hidden="true">
              {hitArea}
            </g>
          );
        })}
      </svg>

      {residences.map((residence) => {
        const unit = planUnits[residence.position];
        if (!unit) return null;
        const sold = residence.status === "sold";
        return (
          <div key={residence.number} aria-hidden="true" className="pointer-events-none">
            <span
              className={cn(
                "absolute flex items-center justify-center text-caption font-semibold lg:hidden",
                sold ? "text-muted-foreground" : "text-foreground",
              )}
              style={boxStyle(unit.rect)}
            >
              {residence.number}
            </span>
            <span
              className="absolute hidden max-w-32 -translate-x-1/2 flex-col items-center text-center lg:flex"
              style={{ left: planX(unit.label.x), top: planY(unit.label.y) }}
            >
              <span className={cn("text-body", sold ? "text-muted-foreground" : "text-foreground")}>
                {residence.number}
              </span>
              <span className="text-caption whitespace-nowrap text-muted-foreground">{areaText(residence, t)}</span>
              {residence.isPenthouse && <span className="text-caption text-muted-foreground">{t.floorPage.penthouse}</span>}
            </span>
          </div>
        );
      })}

      {activeResidence && point && <PlanHoverCard residence={activeResidence} point={point} t={t} />}
    </div>
  );
}
