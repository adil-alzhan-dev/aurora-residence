"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useCurrency } from "@/components/currency/currency-provider";
import { describeFloor } from "@/components/facade/floor-tooltip";
import { Button, ButtonArrow } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Dictionary } from "@/content";
import { floorHref } from "@/content/navigation";
import type { FloorSummary } from "@/lib/api/floors";
import { fillTemplate } from "@/lib/format";

import { FacadeStage, type StageText } from "./facade-stage";
import { FloorPanel, type FloorCell } from "./floor-panel";

type FacadeBrowserProps = {
  /** Counted over the residences that match the filters; null when the API is not reachable. */
  summaries: FloorSummary[] | null;
  cells: FloorCell[];
  initialFloor: number;
  /** Changes only with the filters; a live update may move initialFloor but keeps the visitor's floor. */
  filtersKey: string;
  noMatches: boolean;
  t: StageText & Pick<Dictionary, "status">;
};

export function FacadeBrowser({ summaries, cells, initialFloor, filtersKey, noMatches, t }: FacadeBrowserProps) {
  const [active, setActive] = useState(initialFloor);
  const [shownFilters, setShownFilters] = useState(filtersKey);
  // A new filter can move the preferred floor; follow it, but keep the visitor's choice otherwise.
  if (filtersKey !== shownFilters) {
    setShownFilters(filtersKey);
    setActive(initialFloor);
  }

  const byFloor = useMemo(() => new Map(summaries?.map((summary) => [summary.floor, summary])), [summaries]);
  const dimmed = useMemo(
    () => new Set(summaries?.filter((summary) => summary.available === 0).map((summary) => summary.floor)),
    [summaries],
  );

  const picker = t.residencePicker;
  const { formatPrice } = useCurrency();
  const activeInfo = describeFloor(active, byFloor.get(active), picker, formatPrice);
  const floorLabel = (floor: number) => {
    const info = describeFloor(floor, byFloor.get(floor), picker, formatPrice);
    return [info.title, info.availability, info.price, picker.openPlan].filter(Boolean).join(", ");
  };

  return (
    <>
      <FacadeStage
        active={active}
        select={setActive}
        summary={byFloor.get(active)}
        dimmed={dimmed}
        floorLabel={floorLabel}
        t={t}
      />

      <div className="container-page hidden flex-wrap items-center justify-between gap-x-8 gap-y-4 pt-8 pb-16 lg:flex">
        <div className="flex items-center gap-6">
          <p className="text-overline whitespace-nowrap text-muted-foreground">{picker.legendTitle}</p>
          <StatusBadge status="available" label={t.status.available} />
          <StatusBadge status="reserved" label={t.status.reserved} />
          <StatusBadge status="sold" label={t.status.sold} />
        </div>
        <div className="flex items-center gap-8">
          <p aria-live="polite" className="text-body whitespace-nowrap text-muted-foreground">
            {noMatches
              ? t.residences.noMatches
              : fillTemplate(t.residences.floorSelected, { floor: active, availability: activeInfo.availability })}
          </p>
          <Button asChild>
            <Link href={floorHref(active)} prefetch={false}>
              {fillTemplate(t.residences.openFloorPlan, { floor: active })}
              <ButtonArrow />
            </Link>
          </Button>
        </div>
      </div>

      <FloorPanel
        floor={active}
        summary={byFloor.get(active)}
        cells={cells.filter((cell) => cell.floor === active)}
        onStep={setActive}
        t={t}
      />
    </>
  );
}
