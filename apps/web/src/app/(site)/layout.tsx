import type { ReactNode } from "react";

import { CurrencyProvider } from "@/components/currency/currency-provider";
import { SiteChrome } from "@/components/layout/site-chrome";
import { getMoneySettings } from "@/lib/money-server";

export default async function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <CurrencyProvider initial={await getMoneySettings()}>
      <SiteChrome>{children}</SiteChrome>
    </CurrencyProvider>
  );
}
