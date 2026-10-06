import { floorsTopDown } from "@/components/facade/facade-geometry";
import type { AdminDictionary } from "@/content/en-admin";
import type { AdminResidence, AdminResidenceStatus } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { DashboardCard } from "./dashboard-card";

const statusOrder: AdminResidenceStatus[] = ["AVAILABLE", "RESERVED", "SOLD"];

const cellColor: Record<AdminResidenceStatus, string> = {
  AVAILABLE: "bg-status-free",
  RESERVED: "bg-status-reserved",
  SOLD: "bg-status-sold",
};

const rowClass = "grid grid-cols-[24px_1fr_24px] items-center gap-1";

function countByStatus(residences: AdminResidence[]) {
  const counts: Record<AdminResidenceStatus, number> = { AVAILABLE: 0, RESERVED: 0, SOLD: 0 };
  for (const residence of residences) counts[residence.status] += 1;
  return counts;
}

export function MiniFacade({ residences, t }: { residences: AdminResidence[]; t: AdminDictionary["facade"] }) {
  const counts = countByStatus(residences);
  const byFloor = new Map<number, AdminResidence[]>();
  for (const residence of residences) {
    byFloor.set(residence.floor, [...(byFloor.get(residence.floor) ?? []), residence]);
  }

  return (
    <DashboardCard id="dashboard-facade" title={t.title} lead={t.lead} className="gap-4 p-6 xl:w-[420px] xl:shrink-0">
      <div className="mx-auto flex w-full max-w-[328px] flex-col gap-1">
        <div aria-hidden="true" className={rowClass}>
          <span />
          <span className="h-0.5 bg-foreground" />
        </div>
        <ul className="flex flex-col gap-1">
          {floorsTopDown.map((floor) => {
            const cells = [...(byFloor.get(floor) ?? [])].sort((a, b) => a.position - b.position);
            const label = [
              fillTemplate(t.floor, { floor }),
              ...cells.map((cell) => fillTemplate(t.residence, { number: cell.number, status: t.statuses[cell.status] })),
            ].join(". ");
            return (
              <li key={floor} className={rowClass}>
                <span className="sr-only">{label}</span>
                <span aria-hidden="true" className="text-right text-admin-caption text-muted-foreground">
                  {floor}
                </span>
                <span aria-hidden="true" className="grid grid-cols-6 gap-1">
                  {cells.map((cell) => (
                    <span
                      key={cell.number}
                      title={fillTemplate(t.residence, { number: cell.number, status: t.statuses[cell.status] })}
                      className={cn("h-5 rounded-base", cellColor[cell.status])}
                    />
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
        <div aria-hidden="true" className={rowClass}>
          <span />
          <span className="flex h-5 items-center justify-center border border-border text-label text-muted-foreground">
            {t.entrance}
          </span>
        </div>
      </div>
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {statusOrder.map((status) => (
          <li key={status} className="flex items-center gap-2 text-admin-caption text-foreground">
            <span aria-hidden="true" className={cn("size-2.5", cellColor[status])} />
            {fillTemplate(t.legend, { status: t.statuses[status], count: counts[status] })}
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
