"use client";

import { useState } from "react";

import { useAdminFormat } from "@/components/admin/admin-locale";
import type { AdminDictionary } from "@/content/en-admin";
import { reservationRows } from "@/lib/admin/dashboard-view";
import { useDashboardSummary } from "@/lib/admin/queries";
import { fillTemplate } from "@/lib/format";

import { DashboardError, DashboardSkeleton } from "./dashboard-states";
import { LatestEnquiries } from "./latest-enquiries";
import { MiniFacade } from "./mini-facade";
import { ReservationsCard } from "./reservations-card";
import { StatCards } from "./stat-cards";

export function DashboardView({ t }: { t: AdminDictionary }) {
  const { data: summary, isError, refetch } = useDashboardSummary();
  const [now] = useState(() => new Date());
  const format = useAdminFormat();

  const heading = (
    <div className="flex flex-col gap-1">
      <h1 className="text-admin-title text-foreground">{t.dashboard.title}</h1>
      {summary && (
        <p className="text-admin-body text-muted-foreground">
          {fillTemplate(t.dashboard.subtitle, {
            date: format.longDate(now),
            residences: format.count(summary.residences.total, t.dashboard.residences),
          })}
        </p>
      )}
    </div>
  );

  if (isError && !summary) {
    return (
      <>
        {heading}
        <DashboardError t={t.states} onRetry={() => void refetch()} />
      </>
    );
  }
  if (!summary) {
    return (
      <>
        {heading}
        <DashboardSkeleton label={t.states.loading} />
      </>
    );
  }

  return (
    <>
      {heading}
      <StatCards summary={summary} t={t.dashboard} />
      <div className="flex flex-col gap-4 xl:flex-row">
        <MiniFacade cells={summary.facade} t={t.facade} />
        <ReservationsCard rows={reservationRows(summary.reservations, now)} t={t.reservations} />
      </div>
      <LatestEnquiries items={summary.latestEnquiries} total={summary.enquiries.total} now={now} t={t.enquiries} sources={t.messages} />
    </>
  );
}
