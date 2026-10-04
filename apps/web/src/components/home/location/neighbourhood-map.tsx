"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

import type { Dictionary, PlaceItem } from "@/content";
import { fillTemplate } from "@/lib/format";
import { revealDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { MapDrawing } from "./map-drawing";
import { home, homeLabel, MAP_HEIGHT, MAP_WIDTH, placeLabels, scaleLabel } from "./map-data";

type NeighbourhoodMapProps = {
  t: Dictionary["location"];
  highlighted: PlaceItem["id"] | null;
  className?: string;
};

const labelText = "text-[0.8125rem] leading-5";

// The 1px frame border alone should not turn the map into a draggable one.
const PAN_TOLERANCE_PX = 4;

export function NeighbourhoodMap({ t, highlighted, className }: NeighbourhoodMapProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [pannable, setPannable] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollLeft = home.x - viewport.clientWidth / 2;
    viewport.scrollTop = home.y - viewport.clientHeight / 2;
    const measure = () =>
      setPannable(
        viewport.scrollWidth - viewport.clientWidth > PAN_TOLERANCE_PX ||
          viewport.scrollHeight - viewport.clientHeight > PAN_TOLERANCE_PX,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !pannable) return;
    const viewport = event.currentTarget;
    drag.current = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
    event.currentTarget.scrollTop = drag.current.top - (event.clientY - drag.current.y);
  };

  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div className={cn("relative overflow-hidden bg-card lg:border lg:border-border", className)}>
      <div
        ref={viewportRef}
        role="region"
        aria-label={t.mapLabel}
        tabIndex={pannable ? 0 : -1}
        data-lenis-prevent
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          "size-full overflow-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          pannable && "cursor-grab active:cursor-grabbing",
        )}
      >
        <div className="relative mx-auto select-none" style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}>
          <MapDrawing />
          {t.places.map((place, index) => (
            <p
              key={place.id}
              data-reveal="rise"
              style={{ ...placeLabels[place.id], ...revealDelay(300 + index * 100) }}
              className={cn("absolute flex items-center gap-2 bg-card px-1.5 py-0.5 whitespace-nowrap", labelText)}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-[7px] rounded-full border-[1.2px] border-foreground bg-card transition-transform duration-300 ease-(--ease-out-soft)",
                  highlighted === place.id && "scale-[1.6]",
                )}
              />
              <span className="text-foreground">{place.mapName}</span>
              <span className="text-muted-foreground">{fillTemplate(t.mapMinutes, { minutes: place.minutes })}</span>
            </p>
          ))}
          <p className="absolute flex flex-col gap-0.5 bg-card px-1.5 py-1 whitespace-nowrap" style={homeLabel}>
            <span className="text-label text-primary">{t.home}</span>
            <span className={cn("text-muted-foreground", labelText)}>{t.entrance}</span>
          </p>
          <p
            aria-hidden="true"
            className={cn("absolute flex items-center gap-3 bg-card px-2 py-1 text-muted-foreground", labelText)}
            style={scaleLabel}
          >
            <span className="text-label">{t.north}</span>
            <span className="h-px w-14 bg-muted-foreground" />
            {t.scale}
          </p>
        </div>
      </div>
      {pannable && (
        <p className="pointer-events-none absolute bottom-3 left-3 bg-card px-3 py-2 text-caption text-muted-foreground">
          {t.dragHint}
        </p>
      )}
    </div>
  );
}
