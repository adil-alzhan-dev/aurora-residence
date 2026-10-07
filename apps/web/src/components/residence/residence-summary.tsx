"use client";

import { useCurrency } from "@/components/currency/currency-provider";
import { CurrencySwitcher } from "@/components/layout/settings-switchers";
import { ButtonArrow } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { FLOOR_COUNT } from "@/lib/building";
import { fillTemplate, formatArea } from "@/lib/format";
import { calculateInstalments, DOWN_PAYMENT, TERM_MONTHS } from "@/lib/instalment";
import { cn } from "@/lib/utils";

import { capitalize, sideViewText } from "../residences/list/list-text";
import { RequestButton } from "./enquiry/enquiry-context";

type ResidenceSummaryProps = {
  residence: Residence;
  ceilingM: number;
  t: Dictionary;
};

export function ResidenceSpecs({ residence, ceilingM, t }: ResidenceSummaryProps) {
  const text = t.residencePage;
  const specs = [
    { label: text.floor, value: fillTemplate(text.floorOf, { floor: residence.floor, total: FLOOR_COUNT }) },
    { label: text.bedrooms, value: residence.bedrooms === 0 ? t.floorPage.studio : String(residence.bedrooms) },
    { label: text.area, value: `${formatArea(residence.areaM2)} m²` },
    { label: text.view, value: capitalize(sideViewText(residence, t.list)) },
    { label: text.ceiling, value: fillTemplate(text.ceilingValue, { height: ceilingM.toFixed(1) }), mobileOnly: true },
  ];

  return (
    <dl className="grid lg:grid-cols-2">
      {specs.map((spec) => (
        <div
          key={spec.label}
          className={cn(
            "flex items-center justify-between border-b border-border py-3 lg:flex-col lg:items-start lg:gap-1 lg:border-t lg:border-b-0 lg:py-4",
            spec.mobileOnly && "lg:hidden",
          )}
        >
          <dt className="text-body text-muted-foreground lg:text-caption">{spec.label}</dt>
          <dd className="text-body text-foreground lg:text-body-l">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ResidencePrice({ residence, t }: Omit<ResidenceSummaryProps, "ceilingM">) {
  const { formatPrice } = useCurrency();
  const text = t.residencePage;
  const sold = residence.status === "sold";
  const { monthly } = calculateInstalments(residence.priceUsd, DOWN_PAYMENT.initial, TERM_MONTHS.initial);

  return (
    <div className="flex flex-col gap-2 lg:gap-4 lg:border-t lg:border-border lg:pt-6">
      <div className="flex items-center justify-between">
        <p className="text-overline text-muted-foreground">{text.price}</p>
        <CurrencySwitcher t={t} />
      </div>
      <p className={cn("text-stat whitespace-nowrap", sold ? "text-muted-foreground" : "text-foreground")}>
        {formatPrice(residence.priceUsd)}
      </p>
      {!sold && (
        <p className="text-caption text-muted-foreground">
          {fillTemplate(text.pricePerMetre, {
            perMetre: formatPrice(residence.priceUsd / residence.areaM2),
            monthly: formatPrice(monthly),
          })}
        </p>
      )}
    </div>
  );
}

export function ResidenceRequest({ residence, t }: Omit<ResidenceSummaryProps, "ceilingM">) {
  const text = t.residencePage;
  return (
    <div className="flex flex-col gap-4 lg:gap-8">
      {residence.status === "reserved" && (
        <div className="flex flex-col gap-2 rounded-base bg-status-reserved-subtle p-4">
          <p className="text-overline text-foreground">{text.reservedTitle}</p>
          <p className="text-caption text-foreground">{text.reservedNote}</p>
        </div>
      )}
      <RequestButton className="hidden w-full lg:inline-flex">
        {text.request}
        <ButtonArrow />
      </RequestButton>
      <p className="rounded-base border border-border bg-card p-4 text-caption text-muted-foreground lg:border-0 lg:bg-transparent lg:p-0">
        {text.requestNote}
      </p>
    </div>
  );
}

export function ResidenceTitle({ residence, t }: Omit<ResidenceSummaryProps, "ceilingM">) {
  const text = t.residencePage;
  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <p className="flex items-center gap-3 lg:gap-4">
        <StatusBadge status={residence.status} label={t.status[residence.status]} />
        <span className="text-caption text-muted-foreground">{text.updatedLive}</span>
      </p>
      <h1 className="text-h1 text-foreground">{fillTemplate(text.title, { number: residence.number })}</h1>
      {residence.isPenthouse && <p className="text-overline text-primary">{t.floorPage.penthouse}</p>}
      <p className="max-w-[456px] text-body text-muted-foreground">{text.descriptions[residence.bedrooms]}</p>
    </div>
  );
}
