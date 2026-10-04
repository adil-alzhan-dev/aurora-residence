import { StatusBadge } from "@/components/ui/status-badge";
import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { FLOOR_COUNT } from "@/lib/building";
import { fillTemplate, formatArea, formatUsd } from "@/lib/format";

import { capitalize, sideViewText } from "../../residences/list/list-text";
import { ResidenceDrawing } from "../plan/plan-drawing";

type ResidenceAsideProps = {
  residence: Residence;
  t: Dictionary;
  /** Status line under the title, used on the success screen. */
  note?: string;
};

/** Dark left column of the desktop modal: plan, status, specs and price. */
export function ResidenceAside({ residence, t, note }: ResidenceAsideProps) {
  const page = t.residencePage;
  const specs = [
    { label: page.bedrooms, value: residence.bedrooms === 0 ? t.floorPage.studio : String(residence.bedrooms) },
    { label: page.area, value: `${formatArea(residence.areaM2)} m²` },
    { label: page.floor, value: fillTemplate(page.floorOf, { floor: residence.floor, total: FLOOR_COUNT }) },
    { label: page.view, value: capitalize(sideViewText(residence, t.list)) },
  ];

  return (
    <aside data-theme="dark" className="hidden w-[400px] shrink-0 flex-col gap-6 bg-background p-12 lg:flex">
      <p className="text-overline text-primary">{t.residenceEnquiry.yourResidence}</p>
      <div data-theme="light" className="flex h-55 items-center justify-center rounded-base bg-card px-7 py-4">
        <ResidenceDrawing position={residence.position} className="size-full" />
      </div>
      <div className="flex flex-col items-start gap-3">
        <StatusBadge status={residence.status} label={t.status[residence.status]} />
        <p className="text-h3 text-foreground">{fillTemplate(page.title, { number: residence.number })}</p>
        {residence.isPenthouse && <p className="text-caption text-muted-foreground">{t.floorPage.penthouse}</p>}
        {note && <p className="text-body text-muted-foreground">{note}</p>}
      </div>
      <dl>
        {specs.map((spec) => (
          <div key={spec.label} className="flex justify-between gap-4 border-b border-border py-2.5 text-body">
            <dt className="text-muted-foreground">{spec.label}</dt>
            <dd className="text-foreground">{spec.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-fact text-foreground">{formatUsd(residence.priceUsd)}</p>
    </aside>
  );
}
