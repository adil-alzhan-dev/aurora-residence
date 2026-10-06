import type { AdminDictionary } from "@/content/en-admin";
import { formatShortDate, type ReservationRow } from "@/lib/admin/dashboard-view";
import { adminHref } from "@/lib/admin/paths";
import { fillTemplate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { DashboardCard } from "./dashboard-card";

function daysLeftText(row: ReservationRow, t: AdminDictionary["reservations"]) {
  if (row.daysLeft <= 0) return t.endsToday;
  return row.daysLeft === 1 ? t.dayOne : fillTemplate(t.dayMany, { count: row.daysLeft });
}

export function ReservationsCard({ rows, t }: { rows: ReservationRow[]; t: AdminDictionary["reservations"] }) {
  return (
    <DashboardCard
      id="dashboard-reservations"
      title={t.title}
      lead={t.lead}
      action={{ href: `${adminHref.residences}?status=RESERVED`, label: t.all }}
      className="min-w-0 flex-1 gap-3 p-6"
      headerClassName="max-sm:flex-col max-sm:items-start"
    >
      {rows.length === 0 ? (
        <p className="py-6 text-admin-body text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="flex flex-col">
          {rows.map((row) => (
            <li key={row.number} className="flex min-h-10 items-center gap-3 border-b border-border py-2 sm:gap-0">
              <span className="w-12 shrink-0 text-admin-strong text-foreground sm:w-20">{row.number}</span>
              <span className="min-w-0 flex-1 truncate text-admin-body text-foreground sm:w-50 sm:flex-none">
                {row.client ?? t.noClient}
              </span>
              <span className="hidden w-35 shrink-0 text-admin-body text-muted-foreground md:block">
                {fillTemplate(t.ends, { date: formatShortDate(row.endsAt) })}
              </span>
              <span
                className={cn(
                  "ml-auto shrink-0 whitespace-nowrap",
                  row.endingSoon ? "text-admin-strong text-destructive" : "text-admin-caption text-muted-foreground",
                )}
              >
                {daysLeftText(row, t)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
