import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowRightIcon, ChevronDownIcon } from "@/components/icons";
import type { Dictionary } from "@/content";
import { floorHref, residencesHref } from "@/content/navigation";
import type { FloorSummary } from "@/lib/api/floors";
import { FLOOR_COUNT, isFloorNumber } from "@/lib/building";
import { fillTemplate, formatUsd, padNumber } from "@/lib/format";
import { revealDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";

type FloorHeadingProps = {
  floor: number;
  summary: FloorSummary | null;
  neighbours: FloorSummary[];
  t: Dictionary["floorPage"];
};

function StepLink({ floor, label, children }: { floor: number; label: string; children: ReactNode }) {
  const box =
    "flex size-11 items-center justify-center rounded-base border border-border transition-colors duration-200 lg:size-12";
  if (!isFloorNumber(floor)) {
    return (
      <span aria-hidden="true" className={cn(box, "text-disabled-foreground")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={floorHref(floor)} aria-label={label} scroll={false} className={cn(box, "hover:border-foreground")}>
      {children}
    </Link>
  );
}

export function FloorHeading({ floor, summary, neighbours, t }: FloorHeadingProps) {
  const position = fillTemplate(t.floorOf, { floor: padNumber(floor), total: FLOOR_COUNT });
  const summaryText = summary
    ? summary.fromPriceUsd === null
      ? fillTemplate(t.summarySoldOut, { total: summary.total })
      : fillTemplate(t.summary, {
          available: summary.available,
          total: summary.total,
          price: formatUsd(summary.fromPriceUsd),
        })
    : null;

  const stepper = (
    <nav aria-label={t.floorLabel} className="flex items-center gap-2 lg:gap-6">
      <StepLink floor={floor - 1} label={t.floorBelow}>
        <ChevronDownIcon />
      </StepLink>
      <p className="flex flex-col items-center whitespace-nowrap lg:gap-1">
        <span className="text-caption text-muted-foreground lg:text-label">{t.floorLabel}</span>
        <span className="font-sans text-[17px] leading-7 font-light text-foreground lg:text-h3">{position}</span>
      </p>
      <StepLink floor={floor + 1} label={t.floorAbove}>
        <ChevronDownIcon className="rotate-180" />
      </StepLink>
      {neighbours.length > 0 && (
        <ul className="hidden flex-col gap-1 text-caption text-muted-foreground lg:flex">
          {neighbours.map((neighbour) => (
            <li key={neighbour.floor}>
              {fillTemplate(t.neighbour, { floor: neighbour.floor, available: neighbour.available })}
            </li>
          ))}
        </ul>
      )}
    </nav>
  );

  return (
    <div className="container-page flex flex-col lg:flex-row lg:items-end lg:justify-between lg:py-12">
      <div className="flex items-center justify-between pt-2 lg:hidden">
        <Link href={residencesHref} className="flex min-h-11 items-center gap-2 text-overline text-foreground">
          <ArrowRightIcon className="rotate-180" />
          {t.backShort}
        </Link>
        {stepper}
      </div>

      <div data-reveal="up" className="flex flex-col gap-2 py-6 lg:gap-4 lg:py-0">
        <Link
          href={residencesHref}
          className="group hidden min-h-12 items-center gap-2 self-start text-label text-foreground transition-colors duration-200 hover:text-primary lg:flex"
        >
          <ArrowRightIcon className="rotate-180 transition-transform duration-200 group-hover:-translate-x-1" />
          {t.back}
        </Link>
        <p className="text-overline text-primary">{t.overline}</p>
        <h1 className="text-h1 text-foreground">{fillTemplate(t.title, { floor })}</h1>
        {summaryText && <p className="text-body text-muted-foreground">{summaryText}</p>}
      </div>

      <div data-reveal="up" style={revealDelay(120)} className="hidden lg:block">
        {stepper}
      </div>
    </div>
  );
}
