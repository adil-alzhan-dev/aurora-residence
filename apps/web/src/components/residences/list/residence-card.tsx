"use client";

import Link from "next/link";

import { useCurrency } from "@/components/currency/currency-provider";
import { ArrowRightIcon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import { residenceHref } from "@/content/navigation";
import type { Residence } from "@/lib/api/residences";
import { FLOOR_COUNT } from "@/lib/building";
import { fillTemplate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { areaText, isOpenable } from "../floor/residence-text";
import type { ListRowText } from "./list-row";
import { capitalize, sideViewText } from "./list-text";
import { MiniPlan } from "./mini-plan";

type ResidenceCardProps = {
  residence: Residence;
  t: ListRowText;
};

const cardClass = "flex flex-col gap-4 rounded-base border border-border bg-card p-4 text-foreground";

/** M / Residence Card: the whole card is the tap target; sold residences are shown but do not open. */
export function ResidenceCard({ residence, t }: ResidenceCardProps) {
  const { formatPrice } = useCurrency();
  const openable = isOpenable(residence);
  const details = [
    fillTemplate(t.list.floorOf, { floor: residence.floor, total: FLOOR_COUNT }),
    areaText(residence, t),
    capitalize(sideViewText(residence, t.list)),
  ].join("  ·  ");

  const content = (
    <>
      <span className={cn("flex gap-4", !openable && "opacity-50")}>
        <span className="relative h-20 w-26 shrink-0 bg-background">
          <span className="absolute inset-x-1 top-2 flex h-16 items-center justify-center rounded-base border border-border bg-card">
            <MiniPlan position={residence.position} className="h-[46px] w-[60px]" />
          </span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-overline text-muted-foreground">
            {fillTemplate(t.list.residence, { number: residence.number })}
          </span>
          <span className="text-h3">{t.floorPage.typeNames[residence.bedrooms]}</span>
          <span className="text-caption whitespace-pre-wrap text-muted-foreground">{details}</span>
          {residence.isPenthouse && <span className="text-caption text-muted-foreground">{t.floorPage.penthouse}</span>}
        </span>
      </span>
      <span aria-hidden="true" className="h-px bg-border" />
      <span className="flex min-h-11 items-center justify-between gap-3">
        <span className={cn("text-fact whitespace-nowrap", !openable && "opacity-50")}>
          {formatPrice(residence.priceUsd)}
        </span>
        <span className="flex items-center gap-3">
          <StatusBadge status={residence.status} label={t.status[residence.status]} />
          <ArrowRightIcon className={cn("shrink-0", !openable && "invisible")} />
        </span>
      </span>
    </>
  );

  return openable ? (
    <Link href={residenceHref(residence.number)} prefetch={false} className={cardClass}>
      {content}
    </Link>
  ) : (
    <div className={cardClass}>{content}</div>
  );
}
