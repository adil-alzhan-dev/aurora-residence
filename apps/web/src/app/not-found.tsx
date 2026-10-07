import { generateNotFoundMetadata, NotFoundContent } from "@/components/layout/not-found-content";
import { SiteChrome } from "@/components/layout/site-chrome";

export const generateMetadata = generateNotFoundMetadata;

/** Unmatched URLs render outside the (site) layout, so this page brings the header and footer itself. */
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
