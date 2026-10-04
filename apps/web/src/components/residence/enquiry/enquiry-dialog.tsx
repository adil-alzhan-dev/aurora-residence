"use client";

import * as Dialog from "@radix-ui/react-dialog";

import { CloseIcon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { FLOOR_COUNT } from "@/lib/building";
import { fillTemplate, formatArea, formatUsd } from "@/lib/format";

import { bedroomsShortText } from "../../residences/floor/residence-text";
import { capitalize, sideViewText } from "../../residences/list/list-text";
import { ResidenceDrawing } from "../plan/plan-drawing";
import { ResidenceEnquiryForm } from "./residence-enquiry-form";

type EnquiryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residence: Residence;
  t: Dictionary;
};

const closeButton =
  "flex size-11 items-center justify-center text-foreground transition-colors duration-200 hover:text-primary lg:-m-2.5";

/** Enquiry / Modal on desktop, M / Enquiry on phones: a full-screen sheet with the residence on top. */
export function EnquiryDialog({ open, onOpenChange, residence, t }: EnquiryDialogProps) {
  const text = t.residenceEnquiry;
  const page = t.residencePage;
  const area = `${formatArea(residence.areaM2)} m²`;
  const floor = fillTemplate(page.floorOf, { floor: residence.floor, total: FLOOR_COUNT });
  const specs = [
    { label: page.bedrooms, value: residence.bedrooms === 0 ? t.floorPage.studio : String(residence.bedrooms) },
    { label: page.area, value: area },
    { label: page.floor, value: floor },
    { label: page.view, value: capitalize(sideViewText(residence, t.list)) },
  ];
  const title = fillTemplate(page.title, { number: residence.number });
  const badge = <StatusBadge status={residence.status} label={t.status[residence.status]} />;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-dark/80 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content
          data-theme="light"
          data-lenis-prevent
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-background text-foreground data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in lg:inset-auto lg:top-1/2 lg:left-1/2 lg:flex lg:max-h-[calc(100svh-4rem)] lg:w-[960px] lg:max-w-[calc(100vw-4rem)] lg:-translate-1/2 lg:rounded-base lg:bg-card"
        >
          <aside data-theme="dark" className="hidden w-[400px] shrink-0 flex-col gap-6 bg-background p-12 lg:flex">
            <p className="text-overline text-primary">{text.yourResidence}</p>
            <div data-theme="light" className="flex h-55 items-center justify-center rounded-base bg-card px-7 py-4">
              <ResidenceDrawing position={residence.position} className="size-full" />
            </div>
            <div className="flex flex-col items-start gap-3">
              {badge}
              <p className="text-h3 text-foreground">{title}</p>
              {residence.isPenthouse && <p className="text-caption text-muted-foreground">{t.floorPage.penthouse}</p>}
            </div>
            <dl>
              {specs.map((spec) => (
                <div key={spec.label} className="flex justify-between gap-4 border-b border-border py-2.5 text-body">
                  <dt className="text-muted-foreground">{spec.label}</dt>
                  <dd className="text-foreground">{spec.value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-fact text-foreground">{formatUsd(residence.priceUsd)}</p>
          </aside>

          <div className="flex flex-1 flex-col gap-6 px-4 pb-8 lg:gap-8 lg:overflow-y-auto lg:p-12">
            <div className="flex flex-col gap-3">
              <div className="-mx-4 flex min-h-16 items-center justify-between pr-1.5 pl-4 lg:mx-0 lg:min-h-0 lg:p-0">
                <p className="text-overline text-primary">{text.overline}</p>
                <Dialog.Close className={closeButton} aria-label={text.close}>
                  <CloseIcon />
                </Dialog.Close>
              </div>
              <Dialog.Title className="text-h2 text-foreground lg:text-h3">{text.title}</Dialog.Title>
              <Dialog.Description className="text-body text-muted-foreground">{text.lead}</Dialog.Description>
            </div>

            <div className="flex items-center gap-4 rounded-base border border-border bg-card py-3 pr-4 pl-3 lg:hidden">
              <span className="flex h-16 w-20 shrink-0 items-center justify-center bg-background p-2">
                <ResidenceDrawing position={residence.position} className="size-full opacity-60" />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-body-l text-foreground">{title}</span>
                  {badge}
                </span>
                <span className="text-caption whitespace-pre-wrap text-muted-foreground">
                  {fillTemplate(text.summary, {
                    bedrooms: bedroomsShortText(residence, t.floorPage),
                    area,
                    floor: residence.floor,
                    total: FLOOR_COUNT,
                    price: formatUsd(residence.priceUsd),
                  })}
                </span>
              </span>
            </div>

            <ResidenceEnquiryForm number={residence.number} t={t} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
