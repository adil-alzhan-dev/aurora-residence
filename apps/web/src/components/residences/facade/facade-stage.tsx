"use client";

import { useState } from "react";

import { floorCenter, house, toPercentX, toPercentY } from "@/components/facade/facade-geometry";
import { FacadeOverlay } from "@/components/facade/facade-overlay";
import { FacadeRender, type TimeOfDay } from "@/components/facade/facade-render";
import { FloorRuler } from "@/components/facade/floor-ruler";
import { FloorTooltip } from "@/components/facade/floor-tooltip";
import { useFloorTaps } from "@/components/facade/use-floor-taps";
import { Switcher } from "@/components/ui/switcher";
import type { Dictionary } from "@/content";
import type { FloorSummary } from "@/lib/api/floors";
import { padNumber } from "@/lib/format";

// Figma frames: desktop stage 1440 x 1000 with the render at 115% shifted 163 px left,
// mobile stage 390 x 389 with the house exactly as wide as the screen.
const DESKTOP_SCALE = 1.15;
const DESKTOP_STAGE_HEIGHT = 1000;
const DESKTOP_HOUSE_RIGHT = "82.28%";
const TOOLTIP_ROOM = "232px";

export type StageText = Pick<Dictionary, "residencePicker" | "residences" | "hero" | "a11y">;

type FacadeStageProps = {
  active: number;
  select: (floor: number) => void;
  summary: FloorSummary | undefined;
  dimmed: ReadonlySet<number>;
  floorLabel: (floor: number) => string;
  t: StageText;
};

const stageY = (y: number) => `${((y * DESKTOP_SCALE) / DESKTOP_STAGE_HEIGHT) * 100}%`;

export function FacadeStage({ active, select, summary, dimmed, floorLabel, t }: FacadeStageProps) {
  const [time, setTime] = useState<TimeOfDay>("evening");
  const taps = useFloorTaps({ active, settled: true, select });

  return (
    <div className="relative mx-auto aspect-[390/389] w-full max-w-[1440px] overflow-hidden bg-dark lg:aspect-[1440/1000]">
      <div
        data-reveal="zoom"
        className="absolute top-0 left-[-43.7%] aspect-[3/2] w-[188.26%] lg:left-[-11.32%] lg:w-[122.67%]"
      >
        <FacadeRender
          time={time}
          alt={t.residencePicker.facadeAlt}
          dayAlt={t.hero.renderDayAlt}
          sizes="(min-width: 1024px) min(123vw, 1767px), 189vw"
        />
        <FloorRuler active={active} dimmed={dimmed} />
        <FacadeOverlay
          active={active}
          tapX={taps.tapX}
          dimmed={dimmed}
          floorLabel={floorLabel}
          onHover={select}
          onFocusFloor={taps.handleFocus}
          onFloorClick={taps.handleFloorClick}
          onFloorPointerDown={taps.handlePointerDown}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -translate-y-1/2 rounded-base bg-primary px-2 py-1 text-caption font-semibold text-primary-foreground transition-[top] duration-150 ease-out lg:hidden"
          style={{ left: `calc(${toPercentX(house.left)} + 12px)`, top: toPercentY(floorCenter(active)) }}
        >
          {padNumber(active)}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-0 hidden facade-stage-shade lg:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60px] bg-linear-to-b from-dark to-transparent lg:hidden" />

      <div
        className="pointer-events-none absolute hidden -translate-y-1/2 items-center transition-[top] duration-150 ease-out lg:flex"
        style={{ left: `min(${DESKTOP_HOUSE_RIGHT}, 100% - ${TOOLTIP_ROOM})`, top: stageY(floorCenter(active)) }}
      >
        <span className="h-px w-9 bg-primary" />
        <span className="-ml-[3px] size-[7px] rounded-full bg-primary" />
        <div className="relative ml-2 animate-tooltip-in">
          <FloorTooltip floor={active} summary={summary} t={t.residencePicker} />
          <p className="absolute top-full left-0 mt-4 text-caption whitespace-nowrap text-muted-foreground">
            {t.residences.hintPointer}
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 top-8 hidden lg:block">
        <div className="container-page flex items-center justify-end gap-4">
          <span className="text-caption text-muted-foreground">{t.hero.seeTheHouse}</span>
          <Switcher
            label={t.a11y.timeOfDay}
            value={time}
            onValueChange={setTime}
            options={[
              { value: "day", label: t.hero.day },
              { value: "evening", label: t.hero.evening },
            ]}
          />
        </div>
      </div>

      <p className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-dark/90 px-3 py-2 text-caption whitespace-nowrap text-muted-foreground lg:hidden">
        {t.residences.hintTouch}
      </p>
    </div>
  );
}
