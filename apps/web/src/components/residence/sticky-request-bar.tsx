import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate, formatUsd } from "@/lib/format";

import { RequestButton } from "./enquiry/enquiry-context";

type StickyRequestBarProps = {
  residence: Residence;
  t: Dictionary["residencePage"];
};

/** Phones only: the request button stays at the bottom of the screen while the page scrolls. */
export function StickyRequestBar({ residence, t }: StickyRequestBarProps) {
  return (
    <div
      data-sticky-request
      className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-border bg-card px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <p className="flex flex-col">
        <span className="text-caption text-muted-foreground">
          {fillTemplate(t.residenceShort, { number: residence.number })}
        </span>
        <span className="text-body-l whitespace-nowrap text-foreground">{formatUsd(residence.priceUsd)}</span>
      </p>
      <RequestButton className="flex-1 px-4">{t.request}</RequestButton>
    </div>
  );
}
