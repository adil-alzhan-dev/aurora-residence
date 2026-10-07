import Link from "next/link";
import type { ReactNode } from "react";

import { useAdminFormat } from "@/components/admin/admin-locale";
import { ArrowRightIcon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AdminDictionary } from "@/content/en-admin";
import { adminHref } from "@/lib/admin/paths";
import type { AdminResidence } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";
import { cn } from "@/lib/utils";

type RowProps = {
  residence: AdminResidence;
  t: AdminDictionary["residences"];
  statusCell: ReactNode;
};

const cell = "px-0 py-2 text-admin-body text-foreground";

export const bedroomsText = (bedrooms: number, t: AdminDictionary["residences"]) =>
  bedrooms === 0 ? t.studio : String(bedrooms);

export function ResidenceStatusBadge({
  status,
  statuses,
}: {
  status: AdminResidence["status"];
  statuses: AdminDictionary["facade"]["statuses"];
}) {
  return <StatusBadge status={status.toLowerCase() as Lowercase<typeof status>} label={statuses[status]} />;
}

/** The number link covers the whole row, so a click or Enter anywhere opens the residence. */
export function ResidenceRow({ residence, t, statusCell }: RowProps) {
  const format = useAdminFormat();
  const brief = fillTemplate(t.brief, {
    bedrooms: residence.bedrooms === 0 ? t.studio : fillTemplate(t.bedroomsShort, { count: residence.bedrooms }),
    area: format.decimal(residence.areaM2),
  });
  return (
    <tr className="relative border-b border-border bg-card transition-colors duration-200 last:border-b-0 hover:bg-background has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-primary">
      <th scope="row" className="py-2 pr-4 pl-4 text-left font-normal">
        <Link
          href={adminHref.residence(residence.number)}
          aria-label={fillTemplate(t.openLabel, { number: residence.number })}
          className="text-admin-strong text-foreground outline-none after:absolute after:inset-0 after:content-['']"
        >
          {residence.number}
        </Link>
        {residence.isPenthouse && <span className="block text-admin-caption text-muted-foreground">{t.penthouse}</span>}
        <span className="block text-admin-caption text-muted-foreground md:hidden">{brief}</span>
      </th>
      <td className={cn(cell, "hidden md:table-cell")}>{residence.floor}</td>
      <td className={cn(cell, "hidden md:table-cell")}>{bedroomsText(residence.bedrooms, t)}</td>
      <td className={cn(cell, "hidden md:table-cell")}>{format.decimal(residence.areaM2)}</td>
      <td className={cn(cell, "pr-4 whitespace-nowrap")}>{format.price(residence.priceUsd)}</td>
      <td className={cn(cell, "pr-4")}>
        <div className="relative z-10 w-fit">{statusCell}</div>
      </td>
      <td className={cn(cell, "hidden text-admin-caption whitespace-nowrap text-muted-foreground lg:table-cell")}>
        {format.day(residence.statusChangedAt)}
      </td>
      <td aria-hidden="true" className={cn(cell, "hidden pr-4 sm:table-cell")}>
        <span className="flex items-center justify-end gap-2 text-admin-strong">
          {t.open}
          <ArrowRightIcon />
        </span>
      </td>
    </tr>
  );
}
