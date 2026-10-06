import { Suspense, type ReactNode } from "react";

import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { getDictionary } from "@/content";

import { SiteFooter } from "./site-footer";
import { SiteHeader, SiteHeaderWithView } from "./site-header";

const t = getDictionary("en");

/** Header, footer and smooth scroll of the public site; the admin has its own shell. */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <Suspense fallback={<SiteHeader t={t} />}>
        <SiteHeaderWithView t={t} />
      </Suspense>
      <main id="main">{children}</main>
      <SiteFooter t={t} />
    </>
  );
}
