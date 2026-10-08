import Link from "next/link";

import { useAdminFormat } from "@/components/admin/admin-locale";
import { ResidenceStatusBadge } from "@/components/admin/residences/residence-row";
import { ArrowRightIcon } from "@/components/icons";
import { Button, ButtonArrow } from "@/components/ui/button";
import type { AdminDictionary } from "@/content/en-admin";
import type { AdminFormat } from "@/lib/admin/admin-format";
import { adminHref } from "@/lib/admin/paths";
import type { ResidenceCard } from "@/lib/admin/schemas";
import { FLOOR_COUNT } from "@/lib/building";
import { fillTemplate } from "@/lib/format";

export function bedroomsLabel(bedrooms: number, t: AdminDictionary["residence"], format: AdminFormat) {
  return bedrooms === 0 ? t.studio : format.count(bedrooms, t.bedrooms);
}

export const viewText = (view: string, t: AdminDictionary["residence"]) => t.views[view.toLowerCase()] ?? view;

export function BackToResidences({ label }: { label: string }) {
  return (
    <Link
      href={adminHref.residences}
      className="flex w-fit items-center gap-2 text-admin-strong text-foreground transition-colors duration-200 hover:text-primary max-md:min-h-11"
    >
      <ArrowRightIcon className="rotate-180" />
      {label}
    </Link>
  );
}

type HeadingProps = {
  residence: ResidenceCard;
  t: AdminDictionary["residence"];
  statuses: AdminDictionary["facade"]["statuses"];
};

export function ResidenceHeading({ residence, t, statuses }: HeadingProps) {
  const format = useAdminFormat();
  const summary = [
    fillTemplate(t.summary, { floor: residence.floor, floors: FLOOR_COUNT }),
    bedroomsLabel(residence.bedrooms, t, format),
    fillTemplate(t.area, { area: format.decimal(residence.areaM2) }),
    `${t.sides[residence.side] ?? residence.side}, ${viewText(residence.view, t).toLowerCase()}`,
    ...(residence.isPenthouse ? [t.penthouse] : []),
  ];
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-admin-title text-foreground">{fillTemplate(t.title, { number: residence.number })}</h1>
          <ResidenceStatusBadge status={residence.status} statuses={statuses} />
        </div>
        <p className="text-admin-body text-muted-foreground">
          {summary.map((part, index) => (
            <span key={part}>
              {index > 0 && <span aria-hidden="true">{"  ·  "}</span>}
              {part}
            </span>
          ))}
        </p>
      </div>
      <Button asChild variant="secondary" className="shrink-0 self-start sm:self-auto">
        <a
          href={`/residences/${residence.number}`}
          target="_blank"
          rel="noopener"
          aria-label={fillTemplate(t.viewOnSiteLabel, { number: residence.number })}
        >
          {t.viewOnSite}
          <ButtonArrow />
        </a>
      </Button>
    </div>
  );
}
