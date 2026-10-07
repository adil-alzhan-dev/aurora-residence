"use client";

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react";

import { currencyCookie } from "@/lib/currency-cookie";
import { DEFAULT_CURRENCY, formatMoney, type Currency, type MoneySettings } from "@/lib/money";

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amountUsd: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => undefined,
  formatPrice: (amountUsd) => formatMoney(amountUsd, { currency: DEFAULT_CURRENCY, rates: {} }),
});

type CurrencyProviderProps = {
  initial: MoneySettings;
  children: ReactNode;
};

/** The server reads the cookie first, so the page arrives already in the chosen currency. */
export function CurrencyProvider({ initial, children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState(initial.currency);
  const { rates, locale } = initial;

  const setCurrency = useCallback((next: Currency) => {
    document.cookie = currencyCookie(next);
    setCurrencyState(next);
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      formatPrice: (amountUsd) => formatMoney(amountUsd, { currency, rates, locale }),
    }),
    [currency, setCurrency, rates, locale],
  );

  return <CurrencyContext value={value}>{children}</CurrencyContext>;
}

export const useCurrency = () => use(CurrencyContext);
