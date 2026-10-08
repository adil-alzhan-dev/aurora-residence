"use client";

import { useCurrency } from "@/components/currency/currency-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { FLOOR_COUNT } from "@/lib/building";
import { fillTemplate } from "@/lib/format";

import { areaText, bedroomsShortText } from "../../residences/floor/residence-text";
import { ResidenceDrawing } from "../plan/plan-drawing";

type ResidenceCardProps = {
  residence: Residence;
  t: Dictionary;
  note?: string;
};

/** The residence in one line for phones, above the form and on the success screen. */
export function ResidenceCard({ residence, t, note }: ResidenceCardProps) {
  const { formatPrice } = useCurrency();
  return (
    <div className="flex items-center gap-3 rounded-base border border-border bg-card px-3 py-3 phone:gap-4 phone:pr-4 lg:hidden">
      <span className="flex h-16 w-14 shrink-0 items-center justify-center bg-background p-2 phone:w-20">
        <ResidenceDrawing position={residence.position} className="size-full opacity-60" />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span className="text-body-l whitespace-nowrap text-foreground">{fillTemplate(t.residencePage.title, { number: residence.number })}</span>
          <StatusBadge status={residence.status} label={t.status[residence.status]} className="shrink-0" />
        </span>
        <span className="text-caption whitespace-pre-wrap text-muted-foreground">
          {fillTemplate(t.residenceEnquiry.summary, {
            bedrooms: bedroomsShortText(residence, t.floorPage),
            area: areaText(residence, t),
            floor: residence.floor,
            total: FLOOR_COUNT,
            price: formatPrice(residence.priceUsd),
          })}
        </span>
        {note && <span className="text-caption text-foreground">{note}</span>}
      </span>
    </div>
  );
}
