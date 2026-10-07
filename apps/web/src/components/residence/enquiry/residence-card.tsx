"use client";

import { useCurrency } from "@/components/currency/currency-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { FLOOR_COUNT } from "@/lib/building";
import { fillTemplate, formatArea } from "@/lib/format";

import { bedroomsShortText } from "../../residences/floor/residence-text";
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
    <div className="flex items-center gap-4 rounded-base border border-border bg-card py-3 pr-4 pl-3 lg:hidden">
      <span className="flex h-16 w-20 shrink-0 items-center justify-center bg-background p-2">
        <ResidenceDrawing position={residence.position} className="size-full opacity-60" />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-body-l text-foreground">{fillTemplate(t.residencePage.title, { number: residence.number })}</span>
          <StatusBadge status={residence.status} label={t.status[residence.status]} />
        </span>
        <span className="text-caption whitespace-pre-wrap text-muted-foreground">
          {fillTemplate(t.residenceEnquiry.summary, {
            bedrooms: bedroomsShortText(residence, t.floorPage),
            area: `${formatArea(residence.areaM2)} m²`,
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
