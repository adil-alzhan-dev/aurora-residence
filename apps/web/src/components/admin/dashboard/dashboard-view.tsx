"use client";

import { useState } from "react";

import type { AdminDictionary } from "@/content/en-admin";
import { formatLongDate, reservationRows } from "@/lib/admin/dashboard-view";
import { fillTemplate } from "@/lib/format";

import { DashboardError, DashboardSkeleton } from "./dashboard-states";
import { LatestEnquiries } from "./latest-enquiries";
import { MiniFacade } from "./mini-facade";
import { ReservationsCard } from "./reservations-card";
import { StatCards } from "./stat-cards";
import { useDashboardData } from "./use-dashboard-data";

export function DashboardView({ t }: { t: AdminDictionary }) {
  const data = useDashboardData();
  const [now] = useState(() => new Date());

  const heading = (
    <div className="flex flex-col gap-1">
      <h1 className="text-admin-title text-foreground">{t.dashboard.title}</h1>
      {data.state === "ready" && (
        <p className="text-admin-body text-muted-foreground">
          {fillTemplate(t.dashboard.subtitle, { date: formatLongDate(now), total: data.summary.residences.total })}
        </p>
      )}
    </div>
  );

  if (data.state === "pending") {
    return (
      <>
        {heading}
        <DashboardSkeleton label={t.states.loading} />
      </>
    );
  }
  if (data.state === "error") {
    return (
      <>
        {heading}
        <DashboardError t={t.states} onRetry={data.retry} />
      </>
    );
  }

  const { summary, residences, enquiries, clients } = data;
  const endingSoon = new Set(summary.expiringReservations.map((reservation) => reservation.residence));
  const byNumber = new Map(residences.map((residence) => [residence.number, residence]));

  return (
    <>
      {heading}
      <StatCards summary={summary} t={t.dashboard} />
      <div className="flex flex-col gap-4 xl:flex-row">
        <MiniFacade residences={residences} t={t.facade} />
        <ReservationsCard rows={reservationRows(residences, clients, endingSoon, now)} t={t.reservations} />
      </div>
      <LatestEnquiries items={enquiries.items} total={enquiries.total} residences={byNumber} now={now} t={t.enquiries} />
    </>
  );
}
