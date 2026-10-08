import Link from "next/link";

import { useAdminFormat } from "@/components/admin/admin-locale";
import { ArrowRightIcon } from "@/components/icons";
import type { AdminDictionary } from "@/content/en-admin";
import { adminHref } from "@/lib/admin/paths";
import type { AdminResidence } from "@/lib/admin/schemas";
import { fillTemplate, joinPhrase } from "@/lib/format";

import { ResidenceStatusBadge } from "./residence-row";

type CardsProps = {
  items: AdminResidence[];
  t: AdminDictionary["residences"];
  statuses: AdminDictionary["facade"]["statuses"];
};

/** The status is changed on the residence page only, so a tap in the list never changes anything by accident. */
function ResidenceCard({ residence, t, statuses }: Omit<CardsProps, "items"> & { residence: AdminResidence }) {
  const format = useAdminFormat();
  const bedrooms = residence.bedrooms === 0 ? t.studio : fillTemplate(t.bedroomsShort, { count: residence.bedrooms });
  const brief = fillTemplate(t.brief, { bedrooms, area: format.decimal(residence.areaM2) });
  const floor = fillTemplate(t.floorOption, { floor: residence.floor });
  const price = format.price(residence.priceUsd);
  const label = joinPhrase([
    fillTemplate(t.openLabel, { number: residence.number }),
    statuses[residence.status],
    price,
    floor,
    brief,
    residence.isPenthouse ? t.penthouse : null,
  ]);

  return (
    <Link
      href={adminHref.residence(residence.number)}
      aria-label={label}
      className="flex flex-col gap-3 rounded-base border border-border bg-card p-4 transition-colors duration-200 hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-admin-section text-foreground">{residence.number}</span>
        <ResidenceStatusBadge status={residence.status} statuses={statuses} />
      </span>
      <span className="flex items-end justify-between gap-3">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-admin-strong text-foreground">{price}</span>
          <span className="text-admin-caption text-muted-foreground">{`${floor} · ${brief}`}</span>
          {residence.isPenthouse && <span className="text-admin-caption text-muted-foreground">{t.penthouse}</span>}
        </span>
        <ArrowRightIcon className="mb-0.5 shrink-0 text-foreground" />
      </span>
    </Link>
  );
}

export function ResidenceCards({ items, t, statuses }: CardsProps) {
  return (
    <ul aria-label={fillTemplate(t.tableLabel, { shown: items.length })} className="flex flex-col gap-2">
      {items.map((residence) => (
        <li key={residence.number}>
          <ResidenceCard residence={residence} t={t} statuses={statuses} />
        </li>
      ))}
    </ul>
  );
}
