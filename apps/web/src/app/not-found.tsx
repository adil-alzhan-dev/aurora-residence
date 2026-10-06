import type { Metadata } from "next";

import { NotFoundContent, notFoundTitle } from "@/components/layout/not-found-content";
import { SiteChrome } from "@/components/layout/site-chrome";

export const metadata: Metadata = { title: notFoundTitle };

/** Unmatched URLs render outside the (site) layout, so this page brings the header and footer itself. */
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
