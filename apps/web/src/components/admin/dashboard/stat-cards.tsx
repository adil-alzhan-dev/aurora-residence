import type { ReactNode } from "react";

import type { AdminDictionary } from "@/content/en-admin";
import { percentOf } from "@/lib/admin/dashboard-view";
import type { DashboardSummary } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number;
  dotClass: string;
  note: string;
  noteClass?: string;
  children?: ReactNode;
};

function StatCard({ label, value, dotClass, note, noteClass, children }: StatCardProps) {
  return (
    <li className="flex flex-col items-start gap-2 rounded-base border border-border bg-card p-6">
      <p className="flex items-center gap-2 text-label text-muted-foreground">
        <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", dotClass)} />
        {label}
      </p>
      <p data-stat className="text-admin-stat text-foreground">
        {value}
      </p>
      <p className={cn("text-admin-caption", noteClass ?? "text-muted-foreground")}>{note}</p>
      {children}
    </li>
  );
}

function ShareBar({ summary, label }: { summary: DashboardSummary; label: string }) {
  const parts = [
    { key: "free", value: summary.residences.AVAILABLE, className: "bg-status-free" },
    { key: "reserved", value: summary.residences.RESERVED, className: "bg-status-reserved" },
    { key: "sold", value: summary.residences.SOLD, className: "bg-status-sold" },
  ];
  return (
    <div role="img" aria-label={label} className="flex h-1 w-full max-w-[200px] gap-0.5">
      {parts.map((part) =>
        part.value > 0 ? (
          <span key={part.key} className={cn("h-full min-w-px", part.className)} style={{ flexGrow: part.value }} />
        ) : null,
      )}
    </div>
  );
}

export function StatCards({ summary, t }: { summary: DashboardSummary; t: AdminDictionary["dashboard"] }) {
  const { AVAILABLE, RESERVED, SOLD, total } = summary.residences;
  const ending = summary.reservations.filter((reservation) => reservation.endingSoon).length;
  const waiting = summary.enquiries.new;

  return (
    <ul aria-label={t.statsLabel} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t.available}
        value={AVAILABLE}
        dotClass="bg-status-free"
        note={fillTemplate(t.ofTotal, { total })}
      >
        <ShareBar
          summary={summary}
          label={fillTemplate(t.shareLabel, { available: AVAILABLE, reserved: RESERVED, sold: SOLD })}
        />
      </StatCard>
      <StatCard
        label={t.reserved}
        value={RESERVED}
        dotClass="bg-status-reserved"
        note={
          ending === 0
            ? t.noneEndingSoon
            : ending === 1
              ? t.endingSoonOne
              : fillTemplate(t.endingSoonMany, { count: ending })
        }
        noteClass={ending > 0 ? "text-destructive" : undefined}
      />
      <StatCard
        label={t.sold}
        value={SOLD}
        dotClass="bg-status-sold"
        note={fillTemplate(t.shareOfHouse, { percent: percentOf(SOLD, total) })}
      />
      <StatCard
        label={t.newToday}
        value={summary.enquiries.newToday}
        dotClass="bg-primary"
        note={fillTemplate(t.waitingForCall, { count: waiting })}
      />
    </ul>
  );
}
