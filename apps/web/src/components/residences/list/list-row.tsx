import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Dictionary } from "@/content";
import { residenceHref } from "@/content/navigation";
import type { Residence } from "@/lib/api/residences";
import { FLOOR_COUNT } from "@/lib/building";
import { fillTemplate, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

import { areaText, bedroomsText, isOpenable } from "../floor/residence-text";
import { descriptionText } from "./list-text";
import { MiniPlan } from "./mini-plan";

export type ListRowText = Pick<Dictionary, "list" | "floorPage" | "status">;

type ListRowProps = {
  residence: Residence;
  t: ListRowText;
};

const cell = "py-4 align-middle";

/** Row of the Residences / List frame: hover lights the row as in Figma, the whole row opens the residence. */
export function ListRow({ residence, t }: ListRowProps) {
  const openable = isOpenable(residence);

  return (
    <tr
      className={cn(
        "group/row relative border-b border-border text-body transition-colors duration-200",
        openable ? "text-foreground hover:bg-card has-[a:focus-visible]:bg-card" : "text-muted-foreground",
      )}
    >
      <td className={cn(cell, "hidden pl-4 xl:table-cell")}>
        <span className={cn("flex h-20 w-30 items-center justify-center rounded-base border border-border bg-background", !openable && "opacity-50")}>
          <MiniPlan
            position={residence.position}
            label={fillTemplate(t.list.planOf, { number: residence.number })}
            className="h-[58px] w-[75px]"
          />
        </span>
      </td>
      <td className={cn(cell, "pl-4 xl:pl-0")}>
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-0.5 bg-primary opacity-0 transition-opacity group-hover/row:opacity-100 group-has-[a:focus-visible]/row:opacity-100"
        />
        <span className="block text-body-l">{fillTemplate(t.list.residence, { number: residence.number })}</span>
        <span className="block text-caption text-muted-foreground">{descriptionText(residence, t)}</span>
        {residence.isPenthouse && <span className="block text-caption text-muted-foreground">{t.floorPage.penthouse}</span>}
      </td>
      <td className={cell}>{fillTemplate(t.floorPage.floorOf, { floor: residence.floor, total: FLOOR_COUNT })}</td>
      <td className={cell}>{bedroomsText(residence, t.floorPage)}</td>
      <td className={cn(cell, "whitespace-nowrap")}>{areaText(residence, t.floorPage)}</td>
      <td className={cn(cell, "text-body-l whitespace-nowrap")}>{formatUsd(residence.priceUsd)}</td>
      <td className={cell}>
        <StatusBadge status={residence.status} label={t.status[residence.status]} />
      </td>
      <td className={cn(cell, "pr-4 text-right")}>
        {openable && (
          <Link
            href={residenceHref(residence.number)}
            prefetch={false}
            aria-label={fillTemplate(t.list.detailsOf, { number: residence.number })}
            className="inline-flex min-h-12 items-center gap-3 text-label text-foreground transition-colors duration-200 outline-none group-hover/row:text-primary after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
          >
            {t.list.details}
            <ArrowRightIcon className="shrink-0" />
          </Link>
        )}
      </td>
    </tr>
  );
}
