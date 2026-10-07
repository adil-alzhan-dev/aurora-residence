"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

import { useCurrency } from "@/components/currency/currency-provider";
import { Switcher } from "@/components/ui/switcher";
import type { Dictionary } from "@/content";
import { localeCookie, type Locale } from "@/lib/locale";
import type { Currency } from "@/lib/money";

type SettingsSwitcherProps = {
  t: Dictionary;
  className?: string;
};

/** The server renders the page in the cookie's language, so a switch re-renders the current page in place. */
export function LanguageSwitcher({ t, className }: SettingsSwitcherProps) {
  const { languages } = t.settings;
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [locale, setOptimisticLocale] = useOptimistic(t.locale.lang);

  const changeLocale = (next: Locale) => {
    if (next === locale) return;
    document.cookie = localeCookie(next);
    startTransition(() => {
      setOptimisticLocale(next);
      router.refresh();
    });
  };

  return (
    <Switcher<Locale>
      label={t.a11y.language}
      value={locale}
      onValueChange={changeLocale}
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
