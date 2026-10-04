import Link from "next/link";

import { ChevronDownIcon } from "@/components/icons";
import { Button, ButtonArrow } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import { floorHref } from "@/content/navigation";
import type { FloorSummary } from "@/lib/api/floors";
import type { ResidenceStatus } from "@/lib/api/residences";
import { FLOOR_COUNT } from "@/lib/building";
import { fillTemplate, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

export type FloorCell = {
  number: string;
  floor: number;
  position: number;
  status: ResidenceStatus;
  matches: boolean;
};

const cellTone: Record<ResidenceStatus, string> = {
  available: "bg-status-free-subtle text-foreground",
  reserved: "bg-status-reserved-subtle text-foreground",
  sold: "bg-status-sold-subtle text-muted-foreground",
};

const dotTone: Record<ResidenceStatus, string> = {
  available: "bg-status-free",
  reserved: "bg-status-reserved",
  sold: "bg-status-sold",
};

const stepButton =
  "flex size-11 items-center justify-center rounded-base border border-border transition-colors duration-200 hover:border-foreground disabled:pointer-events-none disabled:text-disabled-foreground";

type FloorPanelProps = {
  floor: number;
  summary: FloorSummary | undefined;
  cells: FloorCell[];
  onStep: (floor: number) => void;
  t: Pick<Dictionary, "residences" | "residencePicker" | "status">;
};

/** Mobile bottom panel from Figma: the selected floor, its numbers, six residences and the way in. */
export function FloorPanel({ floor, summary, cells, onStep, t }: FloorPanelProps) {
  const text = t.residences;
  const factValue = "text-body-l text-foreground";

  return (
    <div className="relative z-10 -mt-4 flex flex-col gap-4 rounded-t-sheet border-t border-border bg-card px-4 pt-2 pb-8 lg:hidden">
      <span aria-hidden="true" className="mx-auto h-1 w-9 rounded-base bg-border" />
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-overline text-primary">{text.floorSelectedOverline}</p>
          <p aria-live="polite" className="text-h1 text-foreground">
            {fillTemplate(t.residencePicker.floor, { floor })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={text.floorBelow}
            disabled={floor <= 1}
            onClick={() => onStep(floor - 1)}
            className={stepButton}
          >
            <ChevronDownIcon />
          </button>
          <button
            type="button"
            aria-label={text.floorAbove}
            disabled={floor >= FLOOR_COUNT}
            onClick={() => onStep(floor + 1)}
            className={stepButton}
          >
            <ChevronDownIcon className="rotate-180" />
          </button>
        </div>
      </div>

      {summary ? (
        <dl className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-caption text-muted-foreground">{text.available}</dt>
            <dd className={cn("flex items-center gap-2", factValue)}>
              <span
                aria-hidden="true"
                className={cn("size-1.5 rounded-full", summary.available > 0 ? "bg-status-free" : "bg-status-sold")}
              />
              {summary.total === 0
                ? t.residencePicker.noMatches
                : fillTemplate(text.availableShort, { available: summary.available, total: summary.total })}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-caption text-muted-foreground">{text.price}</dt>
            <dd className={factValue}>
              {summary.fromPriceUsd === null
                ? t.residencePicker.soldOut
                : fillTemplate(t.residencePicker.fromPrice, { price: formatUsd(summary.fromPriceUsd) })}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-body text-muted-foreground">{t.residencePicker.noData}</p>
      )}

      {cells.length > 0 && (
        <ul aria-label={fillTemplate(text.residencesOnFloor, { floor })} className="flex gap-1">
          {cells.map((cell) => (
            <li
              key={cell.number}
              className={cn(
                "flex h-9 min-w-0 flex-1 items-center justify-center rounded-base text-caption transition-opacity",
                cellTone[cell.status],
                !cell.matches && "opacity-40",
              )}
            >
              <span className="sr-only">{`${cell.number}, ${t.status[cell.status]}`}</span>
              <span aria-hidden="true">{cell.number}</span>
            </li>
          ))}
        </ul>
      )}

      <ul className="flex gap-4" aria-hidden="true">
        {(["available", "reserved", "sold"] as const).map((status) => (
          <li key={status} className="flex items-center gap-2 text-caption text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", dotTone[status])} />
            {t.status[status]}
          </li>
        ))}
      </ul>

      <Button asChild className="w-full">
        <Link href={floorHref(floor)} prefetch={false}>
          {fillTemplate(text.openFloor, { floor })}
          <ButtonArrow />
        </Link>
      </Button>
    </div>
  );
}
