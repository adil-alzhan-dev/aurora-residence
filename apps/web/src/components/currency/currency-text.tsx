"use client";

import { fillTemplate } from "@/lib/format";

import { useCurrency } from "./currency-provider";

/** Fills {currency} in a dictionary string from server-rendered parts of the page. */
export function CurrencyText({ template }: { template: string }) {
  const { currency } = useCurrency();
  return fillTemplate(template, { currency });
}
