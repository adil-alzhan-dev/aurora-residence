import type { MouseEvent, PointerEvent } from "react";

import { floorHref } from "@/content/navigation";
import { cn } from "@/lib/utils";

import { FACADE_HEIGHT, FACADE_WIDTH, floorTop, floorsTopDown, house } from "./facade-geometry";

type FacadeOverlayProps = {
  active: number | null;
  tapX: number | null;
  floorLabel: (floor: number) => string;
  onHover: (floor: number) => void;
  onFocusFloor: (floor: number) => void;
  onFloorClick: (floor: number, event: MouseEvent<Element>) => void;
  onFloorPointerDown: (event: PointerEvent<Element>) => void;
};

const viewBox = `0 0 ${FACADE_WIDTH} ${FACADE_HEIGHT}`;

export function FacadeOverlay({
  active,
  tapX,
  floorLabel,
  onHover,
  onFocusFloor,
  onFloorClick,
  onFloorPointerDown,
}: FacadeOverlayProps) {
  const visible = active !== null;
  const offset = { transform: `translateY(${floorTop(active ?? 1)}px)` };
  const band = { x: house.left, y: 0, width: house.width, height: house.floorHeight };

  return (
    <>
      <svg
        aria-hidden="true"
        viewBox={viewBox}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full opacity-42 mix-blend-screen"
      >
        <rect
          {...band}
          style={offset}
          className={cn("fill-primary transition-[transform,opacity] duration-150 ease-out", !visible && "opacity-0")}
        />
      </svg>
      <svg viewBox={viewBox} preserveAspectRatio="none" className="absolute inset-0 size-full">
        <g style={offset} className={cn("transition-[transform,opacity] duration-150 ease-out", !visible && "opacity-0")}>
          <rect
            {...band}
            vectorEffect="non-scaling-stroke"
            className="fill-none stroke-primary [stroke-width:1] lg:[stroke-width:1.5]"
          />
          {tapX !== null && (
            <g aria-hidden="true" className="lg:hidden" transform={`translate(${tapX} ${house.floorHeight / 2})`}>
              <circle r="30" className="fill-none stroke-foreground" strokeWidth="3.3" />
              <circle r="8.7" className="fill-foreground" />
            </g>
          )}
        </g>
        {floorsTopDown.map((floor) => (
          <a
            key={floor}
            href={floorHref(floor)}
            aria-label={floorLabel(floor)}
            onPointerEnter={(event) => event.pointerType === "mouse" && onHover(floor)}
            onPointerDown={onFloorPointerDown}
            onFocus={() => onFocusFloor(floor)}
            onClick={(event) => onFloorClick(floor, event)}
            className="cursor-pointer [-webkit-tap-highlight-color:transparent]"
          >
            <rect
              x={house.left}
              y={floorTop(floor)}
              width={house.width}
              height={house.floorHeight}
              fill="transparent"
            />
          </a>
        ))}
      </svg>
    </>
  );
}
