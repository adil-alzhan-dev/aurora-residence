"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useState } from "react";

import { EnquirySuccess } from "@/components/enquiry/enquiry-success";
import { CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import { residencesHref } from "@/content/navigation";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ResidenceAside } from "./residence-aside";
import { ResidenceCard } from "./residence-card";
import { ResidenceEnquiryForm } from "./residence-enquiry-form";

type EnquiryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residence: Residence;
  t: Dictionary;
};

const closeButton =
  "flex size-11 items-center justify-center text-foreground transition-colors duration-200 hover:text-primary lg:-m-2.5";

/**
 * Enquiry / Modal and Enquiry / Success on desktop, M / Enquiry and M / Enquiry / Success on phones.
 * Closing after a sent request brings the empty form back next time.
 */
export function EnquiryDialog({ open, onOpenChange, residence, t }: EnquiryDialogProps) {
  const [sent, setSent] = useState(false);
  const text = t.residenceEnquiry;
  const success = t.enquirySend.success;
  const number = { number: residence.number };
  const isReserved = residence.status === "reserved";
  const note = sent ? (isReserved ? success.reserved : success.available) : undefined;

  const handleOpenChange = (next: boolean) => {
    if (!next) setSent(false);
    onOpenChange(next);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-dark/80 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content
          data-theme="light"
          data-lenis-prevent
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-background text-foreground data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in lg:inset-auto lg:top-1/2 lg:left-1/2 lg:flex lg:max-h-[calc(100svh-4rem)] lg:w-[960px] lg:max-w-[calc(100vw-4rem)] lg:-translate-1/2 lg:rounded-base lg:bg-card"
        >
          <ResidenceAside residence={residence} t={t} note={note} />

          <div className={cn("flex flex-1 flex-col px-4 pb-8 lg:gap-8 lg:overflow-y-auto lg:p-12", sent ? "gap-4" : "gap-6")}>
            <div className="flex flex-col gap-3">
              <div className="-mx-4 flex min-h-16 items-center justify-between pr-1.5 pl-4 lg:mx-0 lg:min-h-0 lg:p-0">
                <p className="text-overline text-primary">{sent ? success.overline : text.overline}</p>
                <Dialog.Close className={closeButton} aria-label={text.close}>
                  <CloseIcon />
                </Dialog.Close>
              </div>
              {!sent && (
                <>
                  <Dialog.Title className="text-h2 text-foreground lg:text-h3">{text.title}</Dialog.Title>
                  <Dialog.Description className="text-body text-muted-foreground">{text.lead}</Dialog.Description>
                </>
              )}
            </div>

            {sent ? (
              <EnquirySuccess
                t={success}
                phone={t.contacts.phone}
                lead={fillTemplate(success.leadResidence, number)}
                steps={[success.stepCall, fillTemplate(isReserved ? success.stepReserved : success.stepReserve, number)]}
                card={<ResidenceCard residence={residence} t={t} note={note} />}
                titleAs={Dialog.Title}
                leadAs={Dialog.Description}
                action={
                  <Button asChild className="w-full">
                    <Link href={residencesHref}>{success.backToResidences}</Link>
                  </Button>
                }
              />
            ) : (
              <>
                <ResidenceCard residence={residence} t={t} />
                <ResidenceEnquiryForm number={residence.number} t={t} onSent={() => setSent(true)} />
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
