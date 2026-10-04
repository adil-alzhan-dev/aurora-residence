"use client";

import { Switcher } from "@/components/ui/switcher";
import type { Dictionary } from "@/content";

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
  return (
    <Switcher
      label={t.a11y.currency}
      defaultValue="usd"
      className={className}
      options={[
        { value: "usd", label: currencies.usd },
        { value: "eur", label: currencies.eur },
        { value: "kzt", label: currencies.kzt },
      ]}
    />
  );
}
