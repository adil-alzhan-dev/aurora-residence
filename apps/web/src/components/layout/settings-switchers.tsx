"use client";

import { useCurrency } from "@/components/currency/currency-provider";
import { Switcher } from "@/components/ui/switcher";
import type { Dictionary } from "@/content";
import type { Currency } from "@/lib/money";

type SettingsSwitcherProps = {
  t: Dictionary;
  className?: string;
};

export function LanguageSwitcher({ t, className }: SettingsSwitcherProps) {
  const { languages } = t.settings;
  return (
    <Switcher
      label={t.a11y.language}
      defaultValue="en"
      className={className}
      options={[
        { value: "en", label: languages.en },
        { value: "ru", label: languages.ru },
      ]}
    />
  );
}

export function CurrencySwitcher({ t, className }: SettingsSwitcherProps) {
  const { currencies } = t.settings;
  const { currency, setCurrency } = useCurrency();
  return (
    <Switcher<Currency>
      label={t.a11y.currency}
      value={currency}
      onValueChange={setCurrency}
      className={className}
      options={[
        { value: "USD", label: currencies.usd },
        { value: "EUR", label: currencies.eur },
        { value: "KZT", label: currencies.kzt },
      ]}
    />
  );
}
