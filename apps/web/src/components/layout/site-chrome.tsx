import { Suspense, type ReactNode } from "react";

import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { getSiteDictionary } from "@/lib/locale-server";

import { LiveRefresh } from "./live-refresh";
import { SiteFooter } from "./site-footer";
import { SiteHeader, SiteHeaderWithView } from "./site-header";

/** Header, footer and smooth scroll of the public site; the admin has its own shell. */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const t = await getSiteDictionary();
  // Client components get only their own texts: every prop is serialized into each page.
  const headerText = {
    locale: t.locale,
    a11y: t.a11y,
    settings: t.settings,
    nav: t.nav,
    actions: t.actions,
    contacts: t.contacts,
  };
  return (
    <>
      <SmoothScroll />
      <LiveRefresh />
      <Suspense fallback={<SiteHeader t={headerText} />}>
        <SiteHeaderWithView t={headerText} />
      </Suspense>
      <main id="main">{children}</main>
      <SiteFooter t={t} />
    </>
  );
}
