"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";

import { Button, ButtonArrow } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Dictionary } from "@/content";
import { floorHref, residencesHref } from "@/content/navigation";
import type { FloorSummary } from "@/lib/api/floors";
import { fillTemplate } from "@/lib/format";

import { defaultTapX, FACADE_WIDTH, floorCenter, houseRightPercent, toPercentY } from "./facade-geometry";
import { FacadeOverlay } from "./facade-overlay";
import { FloorRuler } from "./floor-ruler";
import { describeFloor, FloorTooltip } from "./floor-tooltip";
import { useFloorDemo } from "./use-floor-demo";

const DEMO_FLOOR = 7;

type FacadeExplorerProps = {
  floors: FloorSummary[] | null;
  t: Pick<Dictionary, "residencePicker" | "status">;
};

export function FacadeExplorer({ floors, t }: FacadeExplorerProps) {
  const picker = t.residencePicker;
  const stageRef = useRef<HTMLDivElement>(null);
  const pointerType = useRef<string | null>(null);
  const { active, settled, select } = useFloorDemo(stageRef, DEMO_FLOOR);
  const [tapX, setTapX] = useState(defaultTapX);

  const byFloor = useMemo(() => new Map(floors?.map((summary) => [summary.floor, summary])), [floors]);
  const selectedFloor = active ?? DEMO_FLOOR;
  const showTooltip = settled && active !== null;

  const floorLabel = (floor: number) => {
    const info = describeFloor(floor, byFloor.get(floor), picker);
    return [info.title, info.availability, info.price, picker.openPlan].filter(Boolean).join(", ");
  };

  const handlePointerDown = (event: PointerEvent<Element>) => {
    pointerType.current = event.pointerType;
  };

  const handleFloorClick = (floor: number, event: MouseEvent<Element>) => {
    const type = pointerType.current;
    pointerType.current = null;
    const isTap = type === "touch" || type === "pen";
    if (!isTap || (floor === active && settled)) return;
    event.preventDefault();
    const svg = event.currentTarget.closest("svg");
    if (svg) {
      const box = svg.getBoundingClientRect();
      setTapX(((event.clientX - box.left) / box.width) * FACADE_WIDTH);
    }
    select(floor);
  };

  const tooltip = (className?: string) => (
    <FloorTooltip floor={selectedFloor} summary={byFloor.get(selectedFloor)} t={picker} className={className} />
  );

  return (
    <>
      <div
        ref={stageRef}
        className="relative mx-auto h-[440px] w-full max-w-[1440px] overflow-hidden bg-dark lg:aspect-[3/2] lg:h-auto"
      >
        <div
          data-reveal="zoom"
          className="absolute top-[-10px] left-1/2 aspect-[3/2] w-[181.2%] -translate-x-1/2 lg:inset-0 lg:w-full lg:translate-x-0"
        >
          <Image
            src="/images/facade-dusk.jpg"
            alt={picker.facadeAlt}
            fill
            sizes="(min-width: 1024px) min(100vw, 1440px), 182vw"
            className="object-cover"
          />
          <div className="absolute inset-0 hidden facade-shade lg:block" />
          <FloorRuler active={active} />
          <FacadeOverlay
            active={active}
            tapX={tapX}
            floorLabel={floorLabel}
            onHover={select}
            onFocusFloor={select}
            onFloorClick={handleFloorClick}
            onFloorPointerDown={handlePointerDown}
          />
          {showTooltip && (
            <div
              className="pointer-events-none absolute hidden -translate-y-1/2 items-center transition-[top] duration-150 ease-out lg:flex"
              style={{ left: houseRightPercent, top: toPercentY(floorCenter(selectedFloor)) }}
            >
              <span className="h-px w-14 bg-primary" />
              <span className="-ml-[3.5px] size-[7px] rounded-full bg-primary" />
              <div className="relative ml-[12.5px] animate-tooltip-in">
                {tooltip()}
                <p className="absolute top-full left-0 mt-4 text-caption whitespace-nowrap text-muted-foreground">
                  {picker.hintPointer}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] bg-linear-to-b from-transparent to-dark lg:hidden" />
        <div aria-live="polite" className="pointer-events-none absolute bottom-4 left-4 lg:hidden">
          {showTooltip && tooltip("animate-tooltip-in")}
        </div>
        <p className="pointer-events-none absolute right-4 bottom-4 text-caption text-muted-foreground lg:hidden">
          {picker.hintTouch}
        </p>
      </div>

      <div className="container-page mt-8 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <p className="text-overline text-muted-foreground">{picker.legendTitle}</p>
          <div className="flex flex-wrap gap-2 lg:gap-6">
            <StatusBadge status="available" label={t.status.available} />
            <StatusBadge status="reserved" label={t.status.reserved} />
            <StatusBadge status="sold" label={t.status.sold} />
          </div>
        </div>
        <Button asChild className="hidden lg:inline-flex">
          <Link href={residencesHref} prefetch={false}>
            {picker.cta}
            <ButtonArrow />
          </Link>
        </Button>
        <Button asChild className="w-full lg:hidden">
          <Link href={floorHref(selectedFloor)} prefetch={false}>
            {fillTemplate(picker.ctaFloor, { floor: selectedFloor })}
            <ButtonArrow />
          </Link>
        </Button>
      </div>
    </>
  );
}
