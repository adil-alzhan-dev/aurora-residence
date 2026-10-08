import { useAdminFormat } from "@/components/admin/admin-locale";
import { ResidenceDrawing } from "@/components/residence/plan/plan-drawing";
import type { AdminDictionary } from "@/content/en-admin";
import type { ResidenceCard } from "@/lib/admin/schemas";
import { FLOOR_COUNT } from "@/lib/building";
import { fillTemplate, padNumber } from "@/lib/format";
import { layoutOf } from "@/lib/residence-layouts";

import { viewText } from "./residence-heading";

export function ResidenceOverview({ residence, t }: { residence: ResidenceCard; t: AdminDictionary["residence"] }) {
  const { specs } = t;
  const format = useAdminFormat();
  const layout = layoutOf(residence.position, residence.isPenthouse);
  const rows = [
    { label: specs.floor, value: fillTemplate(specs.floorValue, { floor: residence.floor, floors: FLOOR_COUNT }) },
    { label: specs.bedrooms, value: residence.bedrooms === 0 ? t.studio : String(residence.bedrooms) },
    { label: specs.area, value: fillTemplate(t.area, { area: format.decimal(residence.areaM2) }) },
    { label: specs.layout, value: `.${padNumber(residence.position)}, ${t.places[residence.position] ?? ""}` },
    ...(layout ? [{ label: specs.ceiling, value: fillTemplate(specs.ceilingValue, { height: format.decimal(layout.ceilingM) }) }] : []),
    { label: specs.view, value: viewText(residence.view, t) },
  ];

  return (
    <div
      className="flex flex-col gap-6 rounded-base border border-border bg-card p-4 md:flex-row md:items-center md:p-6"
    >
      <div
        role="img"
        aria-label={fillTemplate(t.planLabel, { number: residence.number })}
        className="flex h-50 w-full shrink-0 items-center justify-center rounded-base bg-background md:w-75"
      >
        <div className="flex h-45 w-[270px] max-w-[calc(100%-1.5rem)] items-center justify-center rounded-[4.5px] border-[2.25px] border-border bg-card">
          <ResidenceDrawing position={residence.position} className="h-[131px] w-auto max-w-[80%]" />
        </div>
      </div>
      <dl className="flex min-w-0 flex-1 flex-col">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 border-b border-border py-2">
            <dt className="text-admin-body text-muted-foreground">{row.label}</dt>
            <dd className="text-right text-admin-body text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
