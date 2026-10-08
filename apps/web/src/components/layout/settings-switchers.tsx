"use client";

import { useCurrency } from "@/components/currency/currency-provider";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Switcher } from "@/components/ui/switcher";
import type { Dictionary } from "@/content";
import type { Currency } from "@/lib/money";

export type SettingsText = Pick<Dictionary, "locale" | "a11y" | "settings">;

type SettingsSwitcherProps = {
  t: SettingsText;
  className?: string;
};

export function LanguageSwitcher({ t, className }: SettingsSwitcherProps) {
  return (
    <LocaleSwitcher locale={t.locale.lang} label={t.a11y.language} languages={t.settings.languages} className={className} />
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
