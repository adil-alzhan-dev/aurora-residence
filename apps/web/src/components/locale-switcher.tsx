"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

import { Switcher } from "@/components/ui/switcher";
import { localeCookie, type Locale } from "@/lib/locale";

type LocaleSwitcherProps = {
  locale: Locale;
  label: string;
  languages: Record<Locale, string>;
  className?: string;
};

/**
 * The server renders in the cookie's language, so a switch re-renders the current page in place:
 * client state (the admin session, loaded data, an open form) stays as it is.
 */
export function LocaleSwitcher({ locale: current, label, languages, className }: LocaleSwitcherProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [locale, setOptimisticLocale] = useOptimistic(current);

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
      label={label}
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
