import type { CSSProperties } from "react";

import { padNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { floorCenter, floorsTopDown, toPercentY } from "./facade-geometry";

const RULER_X = "19.354%";
const LABEL_STAGGER_MS = 40;
const FLOORS_OVER_TREES = 2;

type FloorRulerProps = {
  active: number | null;
};

export function FloorRuler({ active }: FloorRulerProps) {
  return (
    <ol aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
      {floorsTopDown.map((floor) => {
        const isActive = floor === active;
        const overTrees = floor <= FLOORS_OVER_TREES;
        return (
          <li
            key={floor}
            data-reveal="fade"
            className="absolute flex -translate-y-1/2 items-center"
            style={
              {
                top: toPercentY(floorCenter(floor)),
                left: `calc(${RULER_X} - 24px)`,
                "--reveal-delay": `${600 + (floor - 1) * LABEL_STAGGER_MS}ms`,
              } as CSSProperties
            }
          >
            <span
              className={cn(
                "flex h-[22px] w-8 items-center justify-center rounded-full text-caption transition-colors duration-150",
                overTrees && "bg-dark/78",
                isActive ? "text-primary" : overTrees ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {padNumber(floor)}
            </span>
            <span
              className={cn(
                "h-px transition-[width,background-color] duration-150",
                isActive ? "w-6 bg-primary" : cn("w-3", overTrees ? "bg-muted-foreground" : "bg-border"),
              )}
            />
          </li>
        );
      })}
    </ol>
  );
}
