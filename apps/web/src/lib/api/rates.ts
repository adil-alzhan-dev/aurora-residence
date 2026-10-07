import { z } from "zod";

import { CURRENCIES, type CurrencyRates } from "@/lib/money";

import { fetchFromApi } from "./client";

const ratesSchema = z.object({
  base: z.literal("USD"),
  rates: z.array(z.object({ code: z.string(), perUsd: z.number().positive() })),
});

/** Empty when the API is unreachable: prices then stay in dollars. */
export async function getCurrencyRates(): Promise<CurrencyRates> {
  const response = await fetchFromApi("/api/rates", ratesSchema);
  const rates: CurrencyRates = {};
  for (const { code, perUsd } of response?.rates ?? []) {
    const currency = CURRENCIES.find((known) => known === code);
    if (currency) rates[currency] = perUsd;
  }
  return rates;
}
