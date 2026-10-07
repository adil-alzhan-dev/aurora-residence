import Link from "next/link";

import { useCurrency } from "@/components/currency/currency-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Dictionary } from "@/content";
import { residenceHref } from "@/content/navigation";
import type { Residence } from "@/lib/api/residences";

import { cn } from "@/lib/utils";

import { areaText, bedroomsText, isOpenable } from "./residence-text";

type ResidenceTableProps = {
  residences: Residence[];
  active: string | null;
  onActivate: (number: string) => void;
  onLeave: () => void;
  t: Pick<Dictionary, "floorPage" | "status">;
};

const cell = "px-0 py-5 align-top text-body first:pl-4 last:pr-4";

/** Desktop table: hovering a row lights the residence on the plan, the whole row opens it. */
export function ResidenceTable({ residences, active, onActivate, onLeave, t }: ResidenceTableProps) {
  const { formatPrice } = useCurrency();
  const columns = t.floorPage.columns;

  return (
    <table className="w-full table-fixed border-collapse text-left" onPointerLeave={onLeave}>
      <thead>
        <tr className="border-b border-border text-caption text-muted-foreground">
          <th scope="col" className="w-[68px] py-3 pl-4 font-normal">
            {columns.number}
          </th>
          <th scope="col" className="w-20 py-3 font-normal">
            {columns.bedrooms}
          </th>
          <th scope="col" className="w-[76px] py-3 font-normal">
            {columns.area}
          </th>
          <th scope="col" className="w-[88px] py-3 font-normal">
            {columns.price}
          </th>
          <th scope="col" className="py-3 pr-4 font-normal">
            {columns.status}
          </th>
        </tr>
      </thead>
      <tbody>
        {residences.map((residence) => {
          const openable = isOpenable(residence);
          const isActive = residence.number === active;
          return (
            <tr
              key={residence.number}
              onPointerEnter={() => onActivate(residence.number)}
              className={cn(
                "relative border-b border-border transition-colors duration-200",
                openable ? "text-foreground" : "text-muted-foreground",
                isActive && "bg-card",
              )}
            >
              <td className={cell}>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-y-0 left-0 w-0.5 bg-primary transition-opacity",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />
                {openable ? (
                  <Link
                    href={residenceHref(residence.number)}
                    prefetch={false}
                    onFocus={() => onActivate(residence.number)}
                    onBlur={onLeave}
                    className="outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
                  >
                    {residence.number}
                  </Link>
                ) : (
                  residence.number
                )}
              </td>
              <td className={cell}>
                {bedroomsText(residence, t.floorPage)}
                {residence.isPenthouse && (
                  <span className="block text-caption whitespace-nowrap text-muted-foreground">
                    {t.floorPage.penthouse}
                  </span>
                )}
              </td>
              <td className={cn(cell, "whitespace-nowrap")}>{areaText(residence, t.floorPage)}</td>
              <td className={cn(cell, "whitespace-nowrap")}>{formatPrice(residence.priceUsd)}</td>
              <td className={cell}>
                <span className="flex h-[26px] items-center">
                  <StatusBadge status={residence.status} label={t.status[residence.status]} />
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
