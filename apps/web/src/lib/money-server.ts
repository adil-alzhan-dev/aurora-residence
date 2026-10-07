import { cookies } from "next/headers";
import { cache } from "react";

import { getCurrencyRates } from "./api/rates";
import { CURRENCY_COOKIE } from "./currency-cookie";
import { parseCurrency, type MoneySettings } from "./money";

/** One read of the cookie and rates per request, shared by the layout and page metadata. */
export const getMoneySettings = cache(async (): Promise<MoneySettings> => {
  const [store, rates] = await Promise.all([cookies(), getCurrencyRates()]);
  return { currency: parseCurrency(store.get(CURRENCY_COOKIE)?.value), rates };
});
