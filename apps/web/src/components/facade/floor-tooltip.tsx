import type { Dictionary } from "@/content";
import type { FloorSummary } from "@/lib/api/floors";
import { fillTemplate, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

type PickerText = Dictionary["residencePicker"];

type FloorTooltipProps = {
  floor: number;
  summary: FloorSummary | undefined;
  t: PickerText;
  className?: string;
};

export function describeFloor(floor: number, summary: FloorSummary | undefined, t: PickerText) {
  const title = fillTemplate(t.floor, { floor });
  if (!summary) return { title, availability: t.noData, price: null, soldOut: false, known: false };
  const soldOut = summary.available === 0;
  const availability =
    summary.total === 0
      ? t.noMatches
      : soldOut
        ? t.soldOut
        : fillTemplate(t.availableOf, { available: summary.available, total: summary.total });
  return {
    title,
    availability,
    price:
      !soldOut && summary.fromPriceUsd !== null
        ? fillTemplate(t.fromPrice, { price: formatUsd(summary.fromPriceUsd) })
        : null,
    soldOut,
    known: true,
  };
}

export function FloorTooltip({ floor, summary, t, className }: FloorTooltipProps) {
  const info = describeFloor(floor, summary, t);
  return (
    <div
      data-theme="dark"
      className={cn(
        "flex w-max flex-col gap-2 rounded-base border-l-2 border-primary bg-card px-6 py-4 text-foreground",
        className,
      )}
    >
      <p className="font-serif text-[2rem] leading-10 font-medium whitespace-nowrap">{info.title}</p>
      <p className="flex items-center gap-2 font-sans text-[0.8125rem] leading-5 whitespace-nowrap text-muted-foreground">
        {info.known && (
          <span
            aria-hidden="true"
            className={cn("size-1.5 shrink-0 rounded-full", info.soldOut ? "bg-status-sold" : "bg-status-free")}
          />
        )}
        {info.availability}
      </p>
      {info.price && <p className="font-sans text-base leading-[1.625rem] whitespace-nowrap text-primary">{info.price}</p>}
    </div>
  );
}
