"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useCurrency } from "@/components/currency/currency-provider";
import { ArrowRightIcon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Dictionary } from "@/content";
import { residenceHref } from "@/content/navigation";
import type { Residence } from "@/lib/api/residences";

import { cn } from "@/lib/utils";

import { areaText, bedroomsShortText, isOpenable } from "./residence-text";

type ResidenceListProps = {
  residences: Residence[];
  t: Pick<Dictionary, "floorPage" | "status">;
};

const rowClass = "flex min-h-[72px] items-center gap-4 border-b border-border py-3";

/** Mobile rows (M / Unit Row): the whole 72 px row is the tap target; sold rows are not links. */
export function ResidenceList({ residences, t }: ResidenceListProps) {
  const { formatPrice } = useCurrency();
  return (
    <ul>
      {residences.map((residence) => {
        const openable = isOpenable(residence);
        const content: ReactNode = (
          <>
            <span
              className={cn("w-14 shrink-0 font-sans text-2xl leading-[30px] font-light", !openable && "opacity-50")}
            >
              {residence.number}
            </span>
            <span className={cn("flex min-w-0 flex-1 flex-col gap-0.5", !openable && "opacity-50")}>
              <span className="text-body text-foreground">
                {bedroomsShortText(residence, t.floorPage)}
                {" · "}
                {areaText(residence, t.floorPage)}
              </span>
              {residence.isPenthouse && (
                <span className="text-caption text-muted-foreground">{t.floorPage.penthouse}</span>
              )}
              <span className="text-caption text-muted-foreground">{formatPrice(residence.priceUsd)}</span>
            </span>
            <StatusBadge status={residence.status} label={t.status[residence.status]} className="shrink-0" />
            <ArrowRightIcon className={cn("shrink-0", !openable && "invisible")} />
          </>
        );
        return (
          <li key={residence.number}>
            {openable ? (
              <Link href={residenceHref(residence.number)} prefetch={false} className={cn(rowClass, "text-foreground")}>
                {content}
              </Link>
            ) : (
              <div className={rowClass}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
