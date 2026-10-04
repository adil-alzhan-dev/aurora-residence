"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

import type { Dictionary } from "@/content";
import { contactLinks } from "@/content/navigation";
import { padNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { inlineLinkClass } from "./form-status";

type EnquirySuccessProps = {
  t: Dictionary["enquirySend"]["success"];
  phone: string;
  lead: string;
  steps: string[];
  action: ReactNode;
  /** Residence summary between the heading and the steps, shown on phones only. */
  card?: ReactNode;
  titleAs?: ElementType;
  leadAs?: ElementType;
  /** Text style of "Thank you": large on the phone sheet, smaller inside a page section. */
  titleClassName?: string;
};

function SuccessMark() {
  return (
    <svg width={56} height={56} viewBox="0 0 56 56" fill="none" aria-hidden="true" className="shrink-0 text-status-free">
      <circle cx={28} cy={28} r={27.5} stroke="currentColor" />
      <path d="M19 28.5L25 34.5L37 21.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Enquiry / Success: the right column of the modal and the full-screen sheet on phones. */
export function EnquirySuccess({
  t,
  phone,
  lead,
  steps,
  action,
  card,
  titleAs: Title = "h3",
  leadAs: Lead = "p",
  titleClassName = "text-h1 lg:text-h3",
}: EnquirySuccessProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titleRef.current?.focus(), []);

  return (
    <div className="flex flex-col gap-8">
      <SuccessMark />
      <div className="flex flex-col gap-3">
        <Title ref={titleRef} tabIndex={-1} className={cn(titleClassName, "text-foreground outline-none")}>
          {t.title}
        </Title>
        <Lead className="text-body-l text-muted-foreground lg:text-body">{lead}</Lead>
      </div>
      {card}
      <div className="flex flex-col">
        <p id="enquiry-next-title" className="pb-2 text-overline text-primary lg:pb-0">
          {t.nextTitle}
        </p>
        <ol aria-labelledby="enquiry-next-title">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-4 border-b border-border py-4 lg:gap-6 lg:py-5">
              <span aria-hidden="true" className="w-8 shrink-0 text-step-number text-primary">
                {padNumber(index + 1)}
              </span>
              <p className="flex-1 text-body text-foreground">{step}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-col items-center gap-3 lg:gap-4">
        {action}
        <p className="text-center text-caption text-muted-foreground">
          {t.questionsBefore}
          <a href={contactLinks.phone} className={inlineLinkClass}>
            {phone}
          </a>
          {t.questionsAfter}
        </p>
      </div>
    </div>
  );
}
