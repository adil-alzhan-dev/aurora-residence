import Link from "next/link";
import type { ReactNode } from "react";

import { useAdminFormat } from "@/components/admin/admin-locale";
import { AdminCard } from "@/components/admin/residence/admin-card";
import { bedroomsLabel } from "@/components/admin/residence/residence-heading";
import { ResidenceStatusBadge } from "@/components/admin/residences/residence-row";
import { ArrowRightIcon } from "@/components/icons";
import { ResidenceDrawing } from "@/components/residence/plan/plan-drawing";
import type { AdminDictionary } from "@/content/en-admin";
import { adminHref } from "@/lib/admin/paths";
import type { EnquiryCard } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";

type Residence = NonNullable<EnquiryCard["residence"]>;

function ResidenceSummary({ residence, t }: { residence: Residence; t: AdminDictionary }) {
  const [floor, position] = residence.number.split(".").map(Number);
  const text = t.enquiry.residence;
  const format = useAdminFormat();
  return (
    <>
      <div
        role="img"
        aria-label={fillTemplate(t.residence.planLabel, { number: residence.number })}
        className="flex h-40 items-center justify-center rounded-base bg-background"
      >
        <div className="flex h-35 w-[210px] max-w-[calc(100%-1.5rem)] items-center justify-center rounded-[3.5px] border-[1.75px] border-border bg-card">
          <ResidenceDrawing position={position} className="h-[102px] w-auto max-w-[80%]" />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-admin-section text-foreground">{fillTemplate(text.name, { number: residence.number })}</h3>
        <ResidenceStatusBadge status={residence.status} statuses={t.facade.statuses} />
      </div>
      <p className="text-admin-body whitespace-pre-wrap text-muted-foreground">
        {fillTemplate(text.specs, {
          floor,
          bedrooms: bedroomsLabel(residence.bedrooms, t.residence, format),
          area: format.decimal(residence.areaM2),
          price: format.price(residence.priceUsd),
        })}
      </p>
      {residence.isPenthouse && <p className="text-admin-caption text-muted-foreground">{t.residence.penthouse}</p>}
    </>
  );
}

type CardProps = {
  enquiry: EnquiryCard;
  t: AdminDictionary;
  reserve?: ReactNode;
  link?: ReactNode;
};

/** The residence of the enquiry with what can be done with it; a general enquiry offers to link one. */
export function EnquiryResidenceCard({ enquiry, t, reserve, link }: CardProps) {
  const { residence } = enquiry;
  return (
    <AdminCard id="enquiry-residence" title={t.enquiry.residence.title} className="gap-4">
      {residence ? (
        <>
          <ResidenceSummary residence={residence} t={t} />
          {reserve}
          <Link
            href={adminHref.residence(residence.number)}
            className="flex w-fit items-center gap-2 text-admin-strong text-foreground transition-colors duration-200 hover:text-primary"
          >
            {fillTemplate(t.enquiry.residence.open, { number: residence.number })}
            <ArrowRightIcon />
          </Link>
        </>
      ) : (
        <>
          <p className="text-admin-body text-foreground">{t.enquiries.general}</p>
          <p className="text-admin-caption text-muted-foreground">{t.enquiry.link.lead}</p>
          {link}
        </>
      )}
    </AdminCard>
  );
}
