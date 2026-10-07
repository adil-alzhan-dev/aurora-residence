"use client";

import { useState } from "react";

import { useCurrency } from "@/components/currency/currency-provider";
import { ButtonArrow } from "@/components/ui/button";
import { RangeField } from "@/components/ui/range-field";
import { RevealSection } from "@/components/motion/reveal-section";
import type { Dictionary } from "@/content";
import { fillTemplate } from "@/lib/format";
import { calculateInstalments, DOWN_PAYMENT, TERM_MONTHS } from "@/lib/instalment";

import { RequestButton } from "./enquiry/enquiry-context";

type InstalmentCalculatorProps = {
  priceUsd: number;
  t: Dictionary["residencePage"];
};

export function InstalmentCalculator({ priceUsd, t }: InstalmentCalculatorProps) {
  const { currency, formatPrice } = useCurrency();
  const text = t.instalments;
  const [percent, setPercent] = useState<number>(DOWN_PAYMENT.initial);
  const [months, setMonths] = useState<number>(TERM_MONTHS.initial);
  const result = calculateInstalments(priceUsd, percent, months);
  const monthsText = (count: number) => fillTemplate(text.months, { count });
  const rows = [
    { label: text.price, value: priceUsd },
    { label: fillTemplate(text.downPaymentRow, { percent: result.percent }), value: result.downPayment },
    { label: text.instalmentsRow, value: result.financed },
  ];
  const disclaimer = <p className="text-caption text-muted-foreground">{fillTemplate(text.disclaimer, { currency })}</p>;

  return (
    <RevealSection aria-labelledby="instalments-title" className="bg-card py-12 lg:container-page lg:bg-transparent lg:pt-0 lg:pb-32">
      <div className="flex flex-col lg:flex-row lg:overflow-hidden lg:rounded-base lg:border lg:border-border lg:bg-card">
        <div className="flex flex-col gap-8 px-4 lg:flex-1 lg:gap-12 lg:p-16">
          <div className="flex flex-col gap-4">
            <p className="text-overline text-primary">{text.overline}</p>
            <h2 id="instalments-title" className="max-w-[560px] text-h2 text-foreground">
              {text.title}
            </h2>
            <p className="max-w-[560px] text-body text-muted-foreground">{text.text}</p>
          </div>
          <RangeField
            id="instalment-down-payment"
            label={text.downPayment}
            value={result.percent}
            valueText={`${result.percent}%`}
            {...DOWN_PAYMENT}
            minText={`${DOWN_PAYMENT.min}%`}
            maxText={`${DOWN_PAYMENT.max}%`}
            onValueChange={setPercent}
          />
          <RangeField
            id="instalment-term"
            label={text.term}
            value={result.term}
            valueText={monthsText(result.term)}
            {...TERM_MONTHS}
            minText={monthsText(TERM_MONTHS.min)}
            maxText={monthsText(TERM_MONTHS.max)}
            onValueChange={setMonths}
          />
        </div>

        <div className="flex flex-col gap-4 px-4 pt-8 lg:w-[520px] lg:shrink-0 lg:p-0">
          <div
            data-theme="dark"
            className="flex flex-col gap-6 rounded-base bg-background px-4 py-6 lg:h-full lg:gap-8 lg:rounded-none lg:bg-card lg:p-16"
          >
            <div className="flex flex-col gap-2">
              <p className="text-overline text-primary lg:text-muted-foreground">{text.monthly}</p>
              <p aria-live="polite" className="text-amount text-foreground">
                {formatPrice(result.monthly)}
              </p>
              <p className="text-caption text-muted-foreground lg:text-body">
                {fillTemplate(text.monthlyNote, { months: result.term })}
              </p>
            </div>
            <dl>
              {rows.map((row) => (
                <div key={row.label} className="flex justify-between gap-4 border-t border-border py-3 text-body lg:py-4">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="text-foreground">{formatPrice(row.value)}</dd>
                </div>
              ))}
            </dl>
            <RequestButton className="hidden w-full lg:inline-flex">
              {t.request}
              <ButtonArrow />
            </RequestButton>
            <div className="hidden max-w-[392px] lg:block">{disclaimer}</div>
          </div>
          <div className="lg:hidden">{disclaimer}</div>
        </div>
      </div>
    </RevealSection>
  );
}
