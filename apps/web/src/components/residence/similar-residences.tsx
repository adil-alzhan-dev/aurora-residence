"use client";

import Link from "next/link";

import { useCurrency } from "@/components/currency/currency-provider";
import { ButtonArrow, Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { RevealSection } from "@/components/motion/reveal-section";
import type { Dictionary } from "@/content";
import { residenceHref, residencesViewHref } from "@/content/navigation";
import type { Residence } from "@/lib/api/residences";
import { FLOOR_COUNT } from "@/lib/building";
import { fillTemplate, formatArea } from "@/lib/format";

import { ResidenceCard } from "../residences/list/residence-card";
import { capitalize, sideViewText } from "../residences/list/list-text";
import { ResidenceDrawing } from "./plan/plan-drawing";

type SimilarResidencesProps = {
  residences: Residence[];
  t: Dictionary;
};

/** Apartment Card from Figma: the whole card opens the residence, hover draws the bronze hairline. */
function ApartmentCard({ residence, t }: { residence: Residence; t: Dictionary }) {
  const { formatPrice } = useCurrency();
  const specs = [
    { label: t.residencePage.area, value: `${formatArea(residence.areaM2)} m²` },
    { label: t.residencePage.floor, value: fillTemplate(t.residencePage.floorOf, { floor: residence.floor, total: FLOOR_COUNT }) },
    { label: t.residencePage.view, value: capitalize(sideViewText(residence, t.list)) },
  ];
  return (
    <Link
      href={residenceHref(residence.number)}
      className="group flex flex-col gap-6 rounded-base border border-border bg-card p-6 text-foreground transition-colors duration-200 hover:border-primary"
    >
      <span className="flex h-50 items-center justify-center rounded-base bg-background px-6 py-5">
        <ResidenceDrawing position={residence.position} className="size-full" />
      </span>
      <span className="flex items-center justify-between gap-4">
        <span className="text-overline text-muted-foreground">
          {fillTemplate(t.list.residence, { number: residence.number })}
        </span>
        <StatusBadge status={residence.status} label={t.status[residence.status]} />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-h3">{t.floorPage.typeNames[residence.bedrooms]}</span>
        {residence.isPenthouse && <span className="text-caption text-muted-foreground">{t.floorPage.penthouse}</span>}
      </span>
      <dl className="flex gap-8">
        {specs.map((spec) => (
          <div key={spec.label} className="flex flex-col gap-1">
            <dt className="text-caption text-muted-foreground">{spec.label}</dt>
            <dd className="text-body whitespace-nowrap">{spec.value}</dd>
          </div>
        ))}
      </dl>
      <span aria-hidden="true" className="h-px bg-border" />
      <span className="flex items-center justify-between gap-4">
        <span className="text-fact">{formatPrice(residence.priceUsd)}</span>
        <span className="flex items-center gap-3 text-label transition-colors duration-200 group-hover:text-primary">
          {t.residencePage.similar.details}
          <ButtonArrow />
        </span>
      </span>
    </Link>
  );
}

export function SimilarResidences({ residences, t }: SimilarResidencesProps) {
  if (residences.length === 0) return null;
  const text = t.residencePage.similar;

  return (
    <RevealSection aria-labelledby="similar-title" className="container-page flex flex-col gap-8 py-12 lg:gap-12 lg:pt-0 lg:pb-32">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-4">
          <p className="text-overline text-primary">{text.overline}</p>
          <h2 id="similar-title" className="text-h2 text-foreground">
            {text.title}
          </h2>
        </div>
        <Button asChild variant="ghost" className="hidden lg:inline-flex">
          <Link href={residencesViewHref("list")}>
            {text.all}
            <ButtonArrow />
          </Link>
        </Button>
      </div>
      <ul className="hidden grid-cols-3 gap-8 lg:grid">
        {residences.map((residence) => (
          <li key={residence.number} className="flex [&>a]:flex-1">
            <ApartmentCard residence={residence} t={t} />
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-4 lg:hidden">
        <ul className="-mx-(--page-gutter) flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-(--page-gutter) px-(--page-gutter) [scrollbar-width:none]">
          {residences.map((residence) => (
            <li key={residence.number} className="w-80 max-w-[85vw] shrink-0 snap-start [&>*]:h-full">
              <ResidenceCard residence={residence} t={t} />
            </li>
          ))}
        </ul>
        <p className="text-caption text-muted-foreground">{text.swipe}</p>
      </div>
    </RevealSection>
  );
}
