"use client";

import { useState } from "react";

import { ArrowRightIcon } from "@/components/icons";
import type { Dictionary } from "@/content";
import type { FloorDetails } from "@/lib/api/floors";
import { fillTemplate } from "@/lib/format";
import { plural } from "@/lib/plural";

import { FloorPlan, type PlanPoint } from "./floor-plan";
import { FloorResidences } from "./floor-residences";
import { planUnits, unitCenter } from "./plan-units";

type FloorExplorerProps = {
  details: FloorDetails;
  t: Dictionary;
};

/** Plan and table share one highlighted residence, so hovering either side lights up the other. */
export function FloorExplorer({ details, t }: FloorExplorerProps) {
  const text = t.floorPage;
  const residences = [...details.residences].sort((a, b) => a.position - b.position);
  const [active, setActive] = useState<string | null>(null);
  const [point, setPoint] = useState<PlanPoint | null>(null);

  const activate = (number: string, at?: PlanPoint) => {
    const unit = planUnits[residences.find((residence) => residence.number === number)?.position ?? 0];
    setActive(number);
    setPoint(at ?? (unit ? unitCenter(unit) : null));
  };
  const clear = () => {
    setActive(null);
    setPoint(null);
  };

  return (
    <div className="flex flex-col gap-8 pb-16 lg:container-page lg:pb-24 xl:flex-row xl:items-start">
      <section
        aria-label={fillTemplate(text.planLabel, { floor: details.floor })}
        data-reveal="up"
        className="flex flex-col gap-3 border-y border-border bg-card py-4 lg:gap-0 lg:rounded-base lg:border lg:py-0 xl:flex-1"
      >
        <div className="flex items-center justify-between px-4 lg:h-10 lg:px-6 lg:pt-6 lg:box-content">
          <p className="text-overline text-muted-foreground">
            {fillTemplate(plural(residences.length, text.planTitle, t.locale.intl), { floor: details.floor, count: residences.length })}
          </p>
          <p className="flex items-center gap-1 text-caption text-muted-foreground lg:gap-2 lg:text-label lg:text-foreground">
            <ArrowRightIcon className="-rotate-90 text-foreground" />
            {text.north}
          </p>
        </div>
        <div className="mx-2 lg:mx-[15px] lg:mt-[23px]">
          <FloorPlan
            residences={residences}
            active={active}
            point={point}
            onActivate={activate}
            onLeave={clear}
            t={t}
          />
        </div>
        <div className="flex items-center justify-between px-4 lg:mx-[15px] lg:mt-6 lg:mb-6 lg:px-0 lg:pr-[9px] lg:pl-2">
          <p className="text-caption text-muted-foreground">{text.southFacade}</p>
          <div aria-hidden="true" className="hidden w-[calc(13.8%+34px)] items-center gap-3 lg:flex">
            <span className="relative h-2 flex-1 border-x border-foreground">
              <span className="absolute inset-x-0 top-1 h-px bg-foreground" />
              <span className="absolute top-0.5 left-1/2 h-[5px] w-px bg-foreground" />
            </span>
            <span className="text-caption whitespace-nowrap text-muted-foreground">{text.scale}</span>
          </div>
        </div>
      </section>

      <FloorResidences
        floor={details}
        residences={residences}
        active={active}
        onActivate={(number) => activate(number)}
        onLeave={clear}
        t={t}
      />
    </div>
  );
}
